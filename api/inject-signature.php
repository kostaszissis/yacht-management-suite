<?php
/**
 * inject-signature.php
 * Παίρνει DOCX (που έχει ήδη κατασκευαστεί από React) + signatures (base64)
 * Επιστρέφει DOCX με εμφανή υπογραφή στο σωστό cell.
 * ΔΕΝ αγγίζει τίποτα άλλο στο DOCX (τιμές, VAT, totals, vessel data παραμένουν ΙΔΙΑ).
 */

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', '/tmp/inject-signature.log');

function jerror($msg, $code = 500) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode(['error' => $msg]);
    exit;
}

// Input: DOCX upload + optional signatures
if (!isset($_FILES['docx']) || $_FILES['docx']['error'] !== UPLOAD_ERR_OK) {
    jerror('Missing docx upload', 400);
}
$uploadedDocx = $_FILES['docx']['tmp_name'];
$chartererSigB64 = $_POST['charterer_signature'] ?? '';
$skipperSigB64   = $_POST['skipper_signature']   ?? '';
$outputName = $_POST['filename'] ?? 'Charter-Party.docx';
$outputName = preg_replace('/[^A-Za-z0-9._-]/', '_', $outputName);
if (!preg_match('/\.docx$/i', $outputName)) $outputName .= '.docx';

// Helpers
function decodeSig($b64) {
    if (!$b64) return null;
    if (strpos($b64, ',') !== false) $b64 = explode(',', $b64, 2)[1];
    $bin = base64_decode($b64, true);
    return ($bin !== false && strlen($bin) >= 100) ? $bin : null;
}

function makeImageXml($rid, $w = 180, $h = 60) {
    $cx = $w * 9525; $cy = $h * 9525;
    return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">'
        .'<wp:extent cx="'.$cx.'" cy="'.$cy.'"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
        .'<wp:docPr id="'.rand(1000,9999).'" name="Signature"/><wp:cNvGraphicFramePr/>'
        .'<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
        .'<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        .'<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        .'<pic:nvPicPr><pic:cNvPr id="'.rand(1000,9999).'" name="sig.png"/><pic:cNvPicPr/></pic:nvPicPr>'
        .'<pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="'.$rid.'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
        .'<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'.$cx.'" cy="'.$cy.'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
        .'</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
}

// Copy upload to tmp
$tmpDocx = tempnam(sys_get_temp_dir(), 'sig_');
copy($uploadedDocx, $tmpDocx);

$zip = new ZipArchive();
if ($zip->open($tmpDocx) !== true) { unlink($tmpDocx); jerror('Cannot open docx'); }

$docXml = $zip->getFromName('word/document.xml');
if ($docXml === false) { $zip->close(); unlink($tmpDocx); jerror('No document.xml'); }

// Decode signatures
$chartererSig = decodeSig($chartererSigB64);
$skipperSig   = decodeSig($skipperSigB64);

if ($chartererSig === null && $skipperSig === null) {
    // No signatures to inject — return as-is
    $zip->close();
    header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    header('Content-Disposition: attachment; filename="'.$outputName.'"');
    header('Content-Length: '.filesize($tmpDocx));
    readfile($tmpDocx);
    unlink($tmpDocx);
    exit;
}

// Add images to zip media
$sigs = [];
$rid = 500;
if ($chartererSig !== null) {
    $zip->addFromString('word/media/charterer_sig.png', $chartererSig);
    $sigs['CHARTERER'] = ['rid' => 'rId'.($rid++), 'filename' => 'charterer_sig.png'];
}
if ($skipperSig !== null) {
    $zip->addFromString('word/media/skipper_sig.png', $skipperSig);
    $sigs['SKIPPER'] = ['rid' => 'rId'.($rid++), 'filename' => 'skipper_sig.png'];
}

// Update relationships
$relsXml = $zip->getFromName('word/_rels/document.xml.rels');
$newRels = '';
foreach ($sigs as $info) {
    $newRels .= '<Relationship Id="'.$info['rid'].'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/'.$info['filename'].'"/>';
}
if ($relsXml !== false && $newRels !== '') {
    $relsXml = str_replace('</Relationships>', $newRels.'</Relationships>', $relsXml);
    $zip->addFromString('word/_rels/document.xml.rels', $relsXml);
}

// Content types — ensure png
$ctXml = $zip->getFromName('[Content_Types].xml');
if ($ctXml !== false && strpos($ctXml, 'image/png') === false) {
    $ctXml = preg_replace('/(<Types[^>]*>)/', '$1<Default Extension="png" ContentType="image/png"/>', $ctXml, 1);
    $zip->addFromString('[Content_Types].xml', $ctXml);
}

/**
 * Αντικατάσταση λογική:
 * Ψάχνουμε τα paragraphs που περιέχουν ένα από τα εξής markers (by priority):
 *   1. {{%CHARTERER_SIGNATURE}} — raw placeholder αν το React δεν το render
 *   2. [object ArrayBuffer] — rendered από docxtemplater όταν το ImageModule fail-άρει
 *   3. undefined — αν περάστηκε undefined value
 *
 * Διάκριση charterer vs skipper:
 *   - Ψάχνουμε το closest w:tc (table cell) που περιέχει το marker
 *   - Αν στο cell υπάρχει "Signed by the Charterer" ή "ναυλωτή" → charterer
 *   - Αν στο cell υπάρχει "Signed by the Skipper"/"Captain"/"Κυβερνήτη" → skipper
 *   - Default (αν δεν βρεθεί label) → charterer
 */

function injectSignature(&$docXml, $imageXml, $context) {
    // $context: array of keywords to match for identifying the correct cell
    // Returns: number of replacements made
    
    // Patterns σε priority order
    $markers = ['{{%CHARTERER_SIGNATURE}}', '{{%SKIPPER_SIGNATURE}}', '[object ArrayBuffer]', 'undefined'];
    
    $replacements = 0;
    
    // Strategy: Βρες όλα τα <w:p>...marker...</w:p>.
    // Για κάθε marker paragraph, βρες το περιβάλλον <w:tc>.
    // Αν το cell περιέχει τα context keywords, αντικατάστησε το paragraph με image.
    
    foreach ($markers as $marker) {
        $searchPos = 0;
        while (($pos = strpos($docXml, $marker, $searchPos)) !== false) {
            // Βρες το περιβάλλον <w:p>...</w:p>
            $pStart = strrpos(substr($docXml, 0, $pos), '<w:p>');
            if ($pStart === false) $pStart = strrpos(substr($docXml, 0, $pos), '<w:p ');
            if ($pStart === false) { $searchPos = $pos + strlen($marker); continue; }
            
            $pEnd = strpos($docXml, '</w:p>', $pos);
            if ($pEnd === false) { $searchPos = $pos + strlen($marker); continue; }
            $pEnd += strlen('</w:p>');
            
            // Βρες το περιβάλλον <w:tc>...</w:tc>
            $tcStart = strrpos(substr($docXml, 0, $pos), '<w:tc>');
            $tcEnd = strpos($docXml, '</w:tc>', $pos);
            
            $cellContent = '';
            if ($tcStart !== false && $tcEnd !== false) {
                $cellContent = substr($docXml, $tcStart, $tcEnd - $tcStart);
            }
            
            // Ελέγχουμε αν το cell ταιριάζει στο context
            $matches = false;
            foreach ($context as $keyword) {
                if (stripos($cellContent, $keyword) !== false) {
                    $matches = true;
                    break;
                }
            }
            
            if ($matches) {
                // Αντικατάσταση ΟΛΟΚΛΗΡΟΥ του paragraph
                $newP = '<w:p><w:pPr><w:jc w:val="center"/></w:pPr>' . $imageXml . '</w:p>';
                $docXml = substr($docXml, 0, $pStart) . $newP . substr($docXml, $pEnd);
                $replacements++;
                $searchPos = $pStart + strlen($newP);
                error_log("Replaced marker '$marker' with image (context: " . implode(',', $context) . ")");
                break 2; // Ένα replacement ανά context, σταμάτα
            }
            
            $searchPos = $pos + strlen($marker);
        }
    }
    
    return $replacements;
}

// Inject Charterer signature
if (isset($sigs['CHARTERER'])) {
    $imgXml = makeImageXml($sigs['CHARTERER']['rid']);
    $ctx = ['Signed by the Charterer', 'ναυλωτή'];
    $n = injectSignature($docXml, $imgXml, $ctx);
    error_log("Charterer signature injected: $n replacements");
}

// Inject Skipper signature
if (isset($sigs['SKIPPER'])) {
    $imgXml = makeImageXml($sigs['SKIPPER']['rid']);
    $ctx = ['Signed by the Skipper', 'Signed by the Captain', 'Κυβερνήτη'];
    $n = injectSignature($docXml, $imgXml, $ctx);
    error_log("Skipper signature injected: $n replacements");
    
    // CREW_LIST_MODE_MARKER: Special handling για Crew List
    // Στο Crew List, η γραμμή υπογραφής είναι 32 underscores σε paragraph
    // μετά από "THE SKIPPER:". Αντικαθιστούμε το paragraph με image.
    $mode = $_POST['mode'] ?? '';
    if ($mode === 'crew_list') {
        $imgXmlCrew = makeImageXml($sigs['SKIPPER']['rid'], 180, 60);
        // Αντί για regex (είχε PCRE backtrack issues), χρησιμοποιούμε απλό strpos
        $underscoreNeedle = str_repeat('_', 32);
        $uPos = strpos($docXml, $underscoreNeedle);
        if ($uPos !== false) {
            $pStart = strrpos(substr($docXml, 0, $uPos), '<w:p');
            $pEnd   = strpos($docXml, '</w:p>', $uPos);
            if ($pStart !== false && $pEnd !== false) {
                $pEnd += strlen('</w:p>');
                $before = substr($docXml, max(0, $pStart - 500), 500);
                if (stripos($before, 'SKIPPER') !== false) {
                    $replacement = '<w:p><w:pPr><w:jc w:val="center"/></w:pPr>' . $imgXmlCrew . '</w:p>';
                    $docXml = substr($docXml, 0, $pStart) . $replacement . substr($docXml, $pEnd);
                    error_log("Crew List: skipper signature injected (strpos method)");
                } else {
                    error_log("Crew List: underscore found but no SKIPPER context (strpos method)");
                }
            } else {
                error_log("Crew List: paragraph boundaries not found around underscores");
            }
        } else {
            error_log("Crew List: no 32-underscore line found (strpos method)");
        }
    }
}

// Cleanup leftover markers (αν έμειναν)
$docXml = str_replace(
    ['{{%CHARTERER_SIGNATURE}}', '{{%SKIPPER_SIGNATURE}}', '[object ArrayBuffer]'],
    '',
    $docXml
);

$zip->addFromString('word/document.xml', $docXml);
$zip->close();

// Stream back
header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
header('Content-Disposition: attachment; filename="'.$outputName.'"');
header('Content-Length: '.filesize($tmpDocx));
header('Cache-Control: no-store, no-cache, must-revalidate');
readfile($tmpDocx);
unlink($tmpDocx);
exit;
