import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVessels, getFloorplan, saveFloorplan, Hotspot, Vessel } from './services/apiService';

const EditFloorPlan: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Vessel selection
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedVesselId, setSelectedVesselId] = useState<number | null>(null);
  const [loadingVessels, setLoadingVessels] = useState(true);

  // Floor plan state
  const [floorplanImage, setFloorplanImage] = useState<string>('');
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [draggedHotspot, setDraggedHotspot] = useState<string | null>(null);
  const [loadingFloorplan, setLoadingFloorplan] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Load vessels on mount
  useEffect(() => {
    const loadVessels = async () => {
      try {
        const vesselList = await getVessels();
        setVessels(vesselList);
      } catch (err) {
        console.error('Error loading vessels:', err);
        setError('Failed to load vessels');
      } finally {
        setLoadingVessels(false);
      }
    };
    loadVessels();
  }, []);

  // Load floorplan when vessel selected
  useEffect(() => {
    if (!selectedVesselId) {
      setFloorplanImage('');
      setHotspots([]);
      return;
    }

    const loadFloorplan = async () => {
      setLoadingFloorplan(true);
      setError('');
      try {
        const floorplan = await getFloorplan(selectedVesselId);
        if (floorplan) {
          setFloorplanImage(floorplan.background_image || '');
          setHotspots(floorplan.hotspots || []);
        } else {
          setFloorplanImage('');
          setHotspots([]);
        }
      } catch (err) {
        console.error('Error loading floorplan:', err);
        setError('Failed to load floorplan');
      } finally {
        setLoadingFloorplan(false);
      }
    };
    loadFloorplan();
  }, [selectedVesselId]);

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
      setHotspots([]); // Clear hotspots when new image uploaded
      setError('');
    };
    reader.readAsDataURL(file);
  };

  // Handle click on image to add hotspot
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (draggedHotspot) return;

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

  // Save floorplan
  const handleSave = async () => {
    if (!selectedVesselId) {
      setError('Please select a vessel first / Επιλέξτε σκάφος');
      return;
    }

    if (!floorplanImage) {
      setError('Please upload an image first / Ανεβάστε εικόνα');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const saved = await saveFloorplan({
        vessel_id: selectedVesselId,
        background_image: floorplanImage,
        hotspots: hotspots,
      });

      if (saved) {
        setSuccess('Floor plan saved successfully! / Η κάτοψη αποθηκεύτηκε!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save floor plan / Αποτυχία αποθήκευσης');
    } finally {
      setSaving(false);
    }
  };

  const selectedHotspotData = hotspots.find(h => h.id === selectedHotspot);
  const selectedVessel = vessels.find(v => v.id === selectedVesselId);

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
      maxWidth: '900px',
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
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
      marginBottom: '16px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '500' as const,
      color: '#374151',
    },
    select: {
      padding: '12px',
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
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
    },
    input: {
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '16px',
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
    success: {
      backgroundColor: '#f0fdf4',
      color: '#16a34a',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '16px',
    },
    loading: {
      textAlign: 'center' as const,
      padding: '40px',
      color: '#6b7280',
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate(-1)}>←</button>
        <h1 style={styles.title}>Edit Floor Plan / Επεξεργασία Κάτοψης</h1>
      </div>

      <div style={styles.content}>
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        {/* Vessel Selection */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Select Vessel / Επιλογή Σκάφους</h2>
          {loadingVessels ? (
            <div style={styles.loading}>Loading vessels... / Φόρτωση σκαφών...</div>
          ) : (
            <div style={styles.formGroup}>
              <label style={styles.label}>Vessel / Σκάφος</label>
              <select
                style={styles.select}
                value={selectedVesselId || ''}
                onChange={(e) => setSelectedVesselId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">-- Select vessel / Επιλέξτε σκάφος --</option>
                {vessels.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.type} - {v.model})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Floor Plan Editor - only show when vessel selected */}
        {selectedVesselId && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Floor Plan for {selectedVessel?.name} / Κάτοψη για {selectedVessel?.name}
            </h2>

            {loadingFloorplan ? (
              <div style={styles.loading}>Loading floor plan... / Φόρτωση κάτοψης...</div>
            ) : !floorplanImage ? (
              <div style={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                <p style={{ margin: '0 0 12px 0', color: '#6b7280' }}>
                  No floor plan found. Upload an image / Δεν βρέθηκε κάτοψη. Ανεβάστε εικόνα
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={styles.label}>Label / Ετικέτα</label>
                        <input
                          style={styles.input}
                          type="text"
                          value={selectedHotspotData.label}
                          onChange={(e) => updateHotspot('label', e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
        )}

        {/* Action Buttons */}
        <div style={styles.actionButtons}>
          <button
            style={styles.cancelButton}
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Back / Πίσω
          </button>
          {selectedVesselId && floorplanImage && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default EditFloorPlan;
