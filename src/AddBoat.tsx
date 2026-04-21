import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVessel, saveFloorplan, Hotspot } from './services/apiService';

interface VesselForm {
  name: string;
  type: string;
  model: string;
  length: string;
  capacity: string;
  year: string;
}

const AddBoat: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Vessel form state
  const [vessel, setVessel] = useState<VesselForm>({
    name: '',
    type: 'Catamaran',
    model: '',
    length: '',
    capacity: '',
    year: new Date().getFullYear().toString(),
  });

  // Floor plan state
  const [floorplanImage, setFloorplanImage] = useState<string>('');
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [draggedHotspot, setDraggedHotspot] = useState<string | null>(null);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  // Handle vessel form changes
  const handleVesselChange = (field: keyof VesselForm, value: string) => {
    setVessel(prev => ({ ...prev, [field]: value }));
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFloorplanImage(event.target?.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  // Handle click on image to add hotspot
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (draggedHotspot) return; // Don't add while dragging

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newHotspot: Hotspot = {
      id: `hotspot-${Date.now()}`,
      x: Math.round(x),
      y: Math.round(y),
      label: `Point ${hotspots.length + 1}`,
      type: 'scratch',
      category: 'cabin',
    };

    setHotspots(prev => [...prev, newHotspot]);
    setSelectedHotspot(newHotspot.id);
  };

  // Handle hotspot drag
  const handleHotspotMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggedHotspot(id);
    setSelectedHotspot(id);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedHotspot || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    setHotspots(prev => prev.map(h =>
      h.id === draggedHotspot ? { ...h, x: Math.round(x), y: Math.round(y) } : h
    ));
  }, [draggedHotspot]);

  const handleMouseUp = () => {
    setDraggedHotspot(null);
  };

  // Update hotspot properties
  const updateHotspot = (field: keyof Hotspot, value: string) => {
    if (!selectedHotspot) return;
    setHotspots(prev => prev.map(h =>
      h.id === selectedHotspot ? { ...h, [field]: value } : h
    ));
  };

  // Delete hotspot
  const deleteHotspot = () => {
    if (!selectedHotspot) return;
    setHotspots(prev => prev.filter(h => h.id !== selectedHotspot));
    setSelectedHotspot(null);
  };

  // Save vessel and floorplan
  const handleSave = async () => {
    // Validation
    if (!vessel.name.trim()) {
      setError('Vessel name is required / Απαιτείται όνομα σκάφους');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // 1. Create vessel
      const result = await createVessel({
        name: vessel.name.trim(),
        type: vessel.type,
        model: vessel.model.trim(),
        length: vessel.length ? parseFloat(vessel.length) : undefined,
        capacity: vessel.capacity ? parseInt(vessel.capacity) : undefined,
        year: vessel.year ? parseInt(vessel.year) : undefined,
      });

      // Handle the response - createVessel returns the API response
      const createdVessel = result?.vessel || result;

      if (!createdVessel || !createdVessel.id) {
        throw new Error('Failed to create vessel');
      }

      // 2. Save floorplan if image uploaded
      if (floorplanImage) {
        const floorplanSaved = await saveFloorplan({
          vessel_id: createdVessel.id,
          background_image: floorplanImage,
          hotspots: hotspots,
        });

        if (!floorplanSaved) {
          console.warn('Floorplan save failed, but vessel was created');
        }
      }

      alert('Vessel saved successfully! / Το σκάφος αποθηκεύτηκε!');
      navigate(-1);

    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save. Please try again. / Αποτυχία αποθήκευσης.');
    } finally {
      setSaving(false);
    }
  };

  const selectedHotspotData = hotspots.find(h => h.id === selectedHotspot);

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
    },
    header: {
      backgroundColor: '#1e40af',
      color: 'white',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    backButton: {
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '4px 8px',
    },
    title: {
      margin: 0,
      fontSize: '20px',
      fontWeight: '600' as const,
    },
    content: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
    },
    section: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    sectionTitle: {
      margin: '0 0 16px 0',
      fontSize: '18px',
      fontWeight: '600' as const,
      color: '#1e40af',
      borderBottom: '2px solid #1e40af',
      paddingBottom: '8px',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '500' as const,
      color: '#374151',
    },
    input: {
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '16px',
    },
    select: {
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '16px',
      backgroundColor: 'white',
    },
    uploadArea: {
      border: '2px dashed #d1d5db',
      borderRadius: '8px',
      padding: '40px 20px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      backgroundColor: '#f9fafb',
    },
    uploadButton: {
      backgroundColor: '#1e40af',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '6px',
      fontSize: '16px',
      cursor: 'pointer',
    },
    imageContainer: {
      position: 'relative' as const,
      display: 'inline-block',
      maxWidth: '100%',
      cursor: 'crosshair',
    },
    floorplanImage: {
      maxWidth: '100%',
      display: 'block',
      borderRadius: '8px',
    },
    hotspot: {
      position: 'absolute' as const,
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      backgroundColor: 'rgba(239, 68, 68, 0.8)',
      border: '3px solid white',
      transform: 'translate(-50%, -50%)',
      cursor: 'move',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '12px',
      fontWeight: 'bold' as const,
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    },
    hotspotSelected: {
      backgroundColor: 'rgba(59, 130, 246, 0.9)',
      boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)',
    },
    hotspotEditor: {
      marginTop: '16px',
      padding: '16px',
      backgroundColor: '#f0f9ff',
      borderRadius: '8px',
      border: '1px solid #bae6fd',
    },
    hotspotEditorTitle: {
      margin: '0 0 12px 0',
      fontSize: '16px',
      fontWeight: '600' as const,
      color: '#0369a1',
    },
    deleteButton: {
      backgroundColor: '#dc2626',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      marginTop: '12px',
    },
    actionButtons: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '20px',
    },
    cancelButton: {
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      padding: '14px 28px',
      borderRadius: '6px',
      fontSize: '16px',
      cursor: 'pointer',
    },
    saveButton: {
      backgroundColor: '#059669',
      color: 'white',
      border: 'none',
      padding: '14px 28px',
      borderRadius: '6px',
      fontSize: '16px',
      cursor: 'pointer',
      fontWeight: '600' as const,
    },
    error: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '16px',
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate(-1)}>←</button>
        <h1 style={styles.title}>Add New Boat / Προσθήκη Σκάφους</h1>
      </div>

      <div style={styles.content}>
        {error && <div style={styles.error}>{error}</div>}

        {/* Section 1: Vessel Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Vessel Details / Στοιχεία Σκάφους</h2>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name / Όνομα *</label>
              <input
                style={styles.input}
                type="text"
                value={vessel.name}
                onChange={(e) => handleVesselChange('name', e.target.value)}
                placeholder="e.g. Maria 1"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Type / Τύπος</label>
              <select
                style={styles.select}
                value={vessel.type}
                onChange={(e) => handleVesselChange('type', e.target.value)}
              >
                <option value="Catamaran">Catamaran</option>
                <option value="Monohull">Monohull</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Model / Μοντέλο</label>
              <input
                style={styles.input}
                type="text"
                value={vessel.model}
                onChange={(e) => handleVesselChange('model', e.target.value)}
                placeholder="e.g. Lagoon 50"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Length (m) / Μήκος</label>
              <input
                style={styles.input}
                type="number"
                step="0.1"
                value={vessel.length}
                onChange={(e) => handleVesselChange('length', e.target.value)}
                placeholder="e.g. 50"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Capacity / Χωρητικότητα</label>
              <input
                style={styles.input}
                type="number"
                value={vessel.capacity}
                onChange={(e) => handleVesselChange('capacity', e.target.value)}
                placeholder="e.g. 12"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Year / Έτος</label>
              <input
                style={styles.input}
                type="number"
                value={vessel.year}
                onChange={(e) => handleVesselChange('year', e.target.value)}
                placeholder="e.g. 2024"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Floor Plan Editor */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Floor Plan / Κάτοψη</h2>

          {!floorplanImage ? (
            <div style={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
              <p style={{ margin: '0 0 12px 0', color: '#6b7280' }}>
                Upload floor plan image / Ανεβάστε εικόνα κάτοψης
              </p>
              <button style={styles.uploadButton} type="button">
                Choose Image / Επιλογή
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>
          ) : (
            <>
              <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px' }}>
                Click on image to add hotspots / Κάντε κλικ στην εικόνα για να προσθέσετε σημεία
              </p>
              <div
                style={styles.imageContainer}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={imageRef}
                  src={floorplanImage}
                  alt="Floor Plan"
                  style={styles.floorplanImage}
                  onClick={handleImageClick}
                  draggable={false}
                />
                {hotspots.map((hotspot, index) => (
                  <div
                    key={hotspot.id}
                    style={{
                      ...styles.hotspot,
                      left: hotspot.x,
                      top: hotspot.y,
                      ...(selectedHotspot === hotspot.id ? styles.hotspotSelected : {}),
                    }}
                    onMouseDown={(e) => handleHotspotMouseDown(e, hotspot.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedHotspot(hotspot.id);
                    }}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '12px' }}>
                <button
                  style={{ ...styles.uploadButton, backgroundColor: '#6b7280' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Replace Image / Αντικατάσταση
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </div>

              {/* Hotspot Editor */}
              {selectedHotspotData && (
                <div style={styles.hotspotEditor}>
                  <h3 style={styles.hotspotEditorTitle}>
                    Edit Hotspot / Επεξεργασία Σημείου
                  </h3>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Label / Ετικέτα</label>
                      <input
                        style={styles.input}
                        type="text"
                        value={selectedHotspotData.label}
                        onChange={(e) => updateHotspot('label', e.target.value)}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Type / Τύπος</label>
                      <select
                        style={styles.select}
                        value={selectedHotspotData.type}
                        onChange={(e) => updateHotspot('type', e.target.value)}
                      >
                        <option value="scratch">Scratch / Γρατζουνιά</option>
                        <option value="dent">Dent / Βαθούλωμα</option>
                        <option value="stain">Stain / Λεκές</option>
                        <option value="crack">Crack / Ρωγμή</option>
                        <option value="tear">Tear / Σκίσιμο</option>
                        <option value="other">Other / Άλλο</option>
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Category / Κατηγορία</label>
                      <select
                        style={styles.select}
                        value={selectedHotspotData.category}
                        onChange={(e) => updateHotspot('category', e.target.value)}
                      >
                        <option value="cabin">Cabin / Καμπίνα</option>
                        <option value="bathroom">Bathroom / Μπάνιο</option>
                        <option value="salon">Salon / Σαλόνι</option>
                        <option value="kitchen">Kitchen / Κουζίνα</option>
                        <option value="deck">Deck / Κατάστρωμα</option>
                        <option value="cockpit">Cockpit / Πηδάλιο</option>
                        <option value="other">Other / Άλλο</option>
                      </select>
                    </div>
                  </div>
                  <button style={styles.deleteButton} onClick={deleteHotspot}>
                    Delete Hotspot / Διαγραφή
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={styles.actionButtons}>
          <button
            style={styles.cancelButton}
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Cancel / Ακύρωση
          </button>
          <button
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.7 : 1,
            }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving... / Αποθήκευση...' : 'Save / Αποθήκευση'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBoat;
