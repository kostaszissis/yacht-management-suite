const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,AlignmentType,BorderStyle,WidthType,ShadingType,VerticalAlign}=require('docx');
const fs=require('fs');
const BLUE="1F5C99",LB="D6E4F0",W="FFFFFF";
const b={style:BorderStyle.SINGLE,size:2,color:"AAAAAA"};
const brd={top:b,bottom:b,left:b,right:b};
const nb={style:BorderStyle.NONE,size:0,color:"FFFFFF"};
const nbrd={top:nb,bottom:nb,left:nb,right:nb};
function c(t,o={}){const{bold:bd=false,color:cl="000000",bg=W,w=1000,sz=14}=o;return new TableCell({width:{size:w,type:WidthType.DXA},borders:brd,shading:{fill:bg,type:ShadingType.CLEAR},margins:{top:40,bottom:40,left:80,right:80},verticalAlign:VerticalAlign.CENTER,children:[new Paragraph({children:[new TextRun({text:t,bold:bd,color:cl,font:"Arial",size:sz})]})]});}
function h(t,o={}){return c(t,{bold:true,color:W,bg:BLUE,sz:14,...o});}
function cr(role,n,sk=false){const bg=sk?LB:W;return new TableRow({height:{value:310,rule:"atLeast"},children:[c(role,{bold:sk,bg,w:1200,sz:14}),c("{{CREW"+n+"_NAME}}",{bg,w:2600,sz:14}),c("{{CREW"+n+"_DOB}}",{bg,w:1300,sz:14}),c("{{CREW"+n+"_PASSPORT}}",{bg,w:1800,sz:14}),c("{{CREW"+n+"_GENDER}}",{bg,w:700,sz:14}),c("{{CREW"+n+"_NATIONALITY}}",{bg,w:1600,sz:14}),c("{{CREW"+n+"_PHONE}}",{bg,w:1700,sz:14}),c("{{CREW"+n+"_EMAIL}}",{bg,w:5100,sz:14})]});}
const TW=16000;
const doc=new Document({sections:[{properties:{page:{size:{width:11906,height:16838,orientation:"landscape"},margin:{top:300,right:300,bottom:300,left:300}}},children:[
new Table({width:{size:TW,type:WidthType.DXA},columnWidths:[2800,13200],rows:[new TableRow({height:{value:620,rule:"atLeast"},children:[
new TableCell({width:{size:2800,type:WidthType.DXA},borders:nbrd,shading:{fill:BLUE,type:ShadingType.CLEAR},margins:{top:60,bottom:60,left:120,right:120},verticalAlign:VerticalAlign.CENTER,children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"TAILWIND YACHTING",bold:true,color:W,font:"Arial",size:30})]})]}),
new TableCell({width:{size:13200,type:WidthType.DXA},borders:nbrd,margins:{top:60,bottom:60,left:200,right:120},verticalAlign:VerticalAlign.CENTER,children:[new Paragraph({children:[new TextRun({text:"CHARTER PARTY No: {{CHARTER_PARTY_NO}}",bold:true,font:"Arial",size:30,color:"1F5C99"})]}),new Paragraph({children:[new TextRun({text:"Tailwind Yachting P.C.  |  Lefkosias 27, Alimos 174 55, Greece  |  EL801356993  |  +30 6978196009",font:"Arial",size:15,color:"555555"})]})]}),
]}),]}),
new Paragraph({children:[new TextRun({text:"",size:3})]}),
new Table({width:{size:TW,type:WidthType.DXA},columnWidths:[1400,2000,1300,2100,1000,1700,6500],rows:[
new TableRow({height:{value:320,rule:"atLeast"},children:[h("YACHT'S NAME",{w:1400}),c("{{YACHT_NAME}}",{w:2000}),h("YACHT'S TYPE",{w:1300}),c("{{YACHT_TYPE}}",{w:2100}),h("FLAG",{w:1000}),c("{{FLAG}}",{w:1700}),c("",{w:6500})]}),
new TableRow({height:{value:320,rule:"atLeast"},children:[h("REGISTRY PORT",{w:1400}),c("{{REGISTRY_PORT}}",{w:2000}),h("REGISTRATION No",{w:1300}),c("{{REGISTRATION_NUMBER}}",{w:2100}),h("CALL SIGN",{w:1000}),c("{{CALL_SIGN}}",{w:1700}),c("",{w:6500})]}),
new TableRow({height:{value:320,rule:"atLeast"},children:[h("EMBARKATION DATE & PLACE",{w:1400}),c("{{EMBARKATION_DATE}} {{EMBARKATION_PLACE}}",{w:2000}),h("DISEMBARKATION DATE & PLACE",{w:1300}),c("{{DISEMBARKATION_DATE}} {{DISEMBARKATION_PLACE}}",{w:2100}),h("E-MITROO",{w:1000}),c("{{E_MITROO}}",{w:1700}),c("",{w:6500})]}),
]}),
new Paragraph({children:[new TextRun({text:"",size:3})]}),
new Table({width:{size:TW,type:WidthType.DXA},columnWidths:[1200,2600,1300,1800,700,1600,1700,5100],rows:[
new TableRow({height:{value:320,rule:"atLeast"},tableHeader:true,children:[h("ROLE",{w:1200}),h("FULL NAME",{w:2600}),h("DATE OF BIRTH",{w:1300}),h("PASSPORT / ID No",{w:1800}),h("GEN",{w:700}),h("NATIONALITY",{w:1600}),h("PHONE",{w:1700}),h("EMAIL",{w:5100})]}),
cr("Skipper",1,true),cr("Passenger 1",2),cr("Passenger 2",3),cr("Passenger 3",4),cr("Passenger 4",5),cr("Passenger 5",6),cr("Passenger 6",7),cr("Passenger 7",8),cr("Passenger 8",9),cr("Passenger 9",10),cr("Passenger 10",11),cr("Passenger 11",12),
]}),
new Paragraph({children:[new TextRun({text:"",size:3})]}),
new Table({width:{size:TW,type:WidthType.DXA},columnWidths:[3800,5200,4000,3000],rows:[new TableRow({height:{value:420,rule:"atLeast"},children:[c("Arrival time in the marina: ___________",{w:3800,sz:14}),c("Skipper's mobile: {{SKIPPER_MOBILE}}   Skipper's name: {{SKIPPER_NAME}}",{w:5200,sz:14}),c("Charterer's mobile: {{CHARTERER_MOBILE}}",{w:4000,sz:14}),c("",{w:3000})]})]}),
new Paragraph({children:[new TextRun({text:"",size:3})]}),
new Table({width:{size:TW,type:WidthType.DXA},columnWidths:[8000,8000],rows:[new TableRow({height:{value:2000,rule:"atLeast"},children:[
new TableCell({width:{size:8000,type:WidthType.DXA},borders:brd,shading:{fill:LB,type:ShadingType.CLEAR},margins:{top:100,bottom:100,left:140,right:140},children:[new Paragraph({children:[new TextRun({text:"X SARONIKOY / A NT FLOISVOY N/F ALIMOY",bold:true,font:"Arial",size:16})]}),new Paragraph({children:[new TextRun({text:"THEORITHIKE - GIA TON APOPLOY GIA KYKLADES / SARONIKO",font:"Arial",size:15})]}),new Paragraph({children:[new TextRun({text:"THN 08:00 ORA ME PLHROMA 1  KAI EPIVATES ____",font:"Arial",size:15})]}),new Paragraph({children:[new TextRun({text:"{{EMBARKATION_DATE}}  -  H LIMENIKH ARXH",font:"Arial",size:15})]})]}),
new TableCell({width:{size:8000,type:WidthType.DXA},borders:brd,margins:{top:100,bottom:100,left:140,right:140},children:[new Paragraph({children:[new TextRun({text:"PLACE: ALIMOS MARINA",font:"Arial",size:15})]}),new Paragraph({children:[new TextRun({text:"DATE: {{EMBARKATION_DATE}}",font:"Arial",size:15})]}),new Paragraph({children:[new TextRun({text:"THE SKIPPER: {{SKIPPER_NAME}}",font:"Arial",size:15})]}),new Paragraph({children:[new TextRun({text:"________________________________",font:"Arial",size:15})]}),new Paragraph({children:[new TextRun({text:"{{SKIPPER_NAME}}",bold:true,font:"Arial",size:15})]})]}),
]}),]}),
]}]});
Packer.toBuffer(doc).then(b=>{const p="/var/www/yacht-prod";fs.writeFileSync(p+"/public/templates/CrewList2026.docx",b);fs.writeFileSync(p+"/build/templates/CrewList2026.docx",b);fs.writeFileSync(p+"/templates/CrewList2026.docx",b);console.log("Done:",b.length,"bytes");});
