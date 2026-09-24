import React, { useState } from 'react';
import { QrCode, Scan, CheckCircle, ShieldCheck, AlertCircle, FileCheck, ArrowRight, UserCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function QRTraceabilityModal({ isOpen, onClose, batchData, onVerifySuccess }) {
  const [activeTab, setActiveTab] = useState('view'); // 'view' or 'scan'
  const [scanInputId, setScanInputId] = useState('BATCH-TN-2026-TOM-001');
  const [scannedResult, setScannedResult] = useState(batchData || null);
  const [loading, setLoading] = useState(false);
  const [verifiedState, setVerifiedState] = useState(batchData?.verification_status === 'Verified & Accepted');

  if (!isOpen) return null;

  const handleScanLookup = async (idToSearch) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/qr/verify/${idToSearch || scanInputId}`);
      if (res.ok) {
        const data = await res.json();
        setScannedResult(data);
        setVerifiedState(data.verification_status === 'Verified & Accepted');
      } else {
        alert("Batch not found in National Traceability Registry.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to verify QR batch");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInspection = async () => {
    if (!scannedResult) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/qr/verify/${scannedResult.batch_id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const resData = await res.json();
        setVerifiedState(true);
        setScannedResult({ ...scannedResult, verification_status: 'Verified & Accepted' });
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        if (onVerifySuccess) onVerifySuccess(scannedResult.batch_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentBatch = scannedResult || batchData;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 47, 29, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
      <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #e2ece6', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '12px', color: '#108e56' }}>
              <QrCode size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0a2f1d' }}>
                Farm-to-Fork QR Traceability Batch
              </h2>
              <div style={{ fontSize: '0.82rem', color: '#4b6357' }}>
                Cryptographic agricultural provenance & audit trail (SIH26033)
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f3', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => setActiveTab('view')}
            style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', border: activeTab === 'view' ? '2px solid #10b981' : '1px solid #cbdcd3', background: activeTab === 'view' ? '#ecfdf5' : '#ffffff', color: activeTab === 'view' ? '#059669' : '#4b6357' }}
          >
            🔍 View Batch QR Code
          </button>
          <button 
            onClick={() => setActiveTab('scan')}
            style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', border: activeTab === 'scan' ? '2px solid #10b981' : '1px solid #cbdcd3', background: activeTab === 'scan' ? '#ecfdf5' : '#ffffff', color: activeTab === 'scan' ? '#059669' : '#4b6357' }}
          >
            📷 Scan & Verify QR
          </button>
        </div>

        {/* Tab: View Batch QR */}
        {activeTab === 'view' && currentBatch && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', background: '#f8faf9', borderRadius: '14px', border: '1px solid #e2ece6', marginBottom: '20px' }}>
              {currentBatch.qr_code_base64 ? (
                <img 
                  src={currentBatch.qr_code_base64} 
                  alt="Batch QR Code" 
                  style={{ width: '200px', height: '200px', borderRadius: '10px', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }} 
                />
              ) : (
                <div style={{ width: '200px', height: '200px', background: '#e2ece6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                  <QrCode size={48} color="#4b6357" />
                </div>
              )}
              
              <div style={{ marginTop: '12px', fontWeight: 800, fontSize: '1.1rem', color: '#0a2f1d', letterSpacing: '0.04em' }}>
                {currentBatch.batch_id}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#108e56', fontWeight: 600 }}>
                Verified Virtual FPO Batch • {currentBatch.crop_name} ({currentBatch.total_quantity_kg} kg)
              </div>
            </div>

            {/* Traceability Details Table */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2ece6', overflow: 'hidden', marginBottom: '16px' }}>
              <table style={{ width: '100%', fontSize: '0.88rem', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f3' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#4b6357', width: '38%' }}>Origin Farmers:</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0a2f1d' }}>{currentBatch.farmer_names}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f3' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#4b6357' }}>Origin District:</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0a2f1d' }}>{currentBatch.origin_district || 'Coimbatore, Tamil Nadu'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f3' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#4b6357' }}>Quality Grade:</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#059669' }}>
                      <span className="badge badge-success">✓ {currentBatch.quality_grade} (Certified)</span>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f3' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#4b6357' }}>Harvest Date:</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0a2f1d' }}>{currentBatch.harvest_date}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f3' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#4b6357' }}>Buyer:</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0284c7' }}>{currentBatch.buyer_name}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#4b6357' }}>Inspection Status:</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>
                      <span className={`badge ${verifiedState ? 'badge-success' : 'badge-warning'}`}>
                        {verifiedState ? '✓ Verified & Accepted' : '⏳ Verification Pending'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setActiveTab('scan')}
                className="btn-rural btn-rural-primary" 
                style={{ flex: 1, minHeight: '44px', fontSize: '0.95rem' }}
              >
                <Scan size={18} /> Proceed to Scan / Inspect
              </button>
            </div>
          </div>
        )}

        {/* Tab: Scan & Inspect */}
        {activeTab === 'scan' && (
          <div>
            <div style={{ background: '#f8faf9', padding: '18px', borderRadius: '12px', border: '1px solid #cbdcd3', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px', color: '#0a2f1d' }}>
                Simulate Camera QR Scanner or Enter Batch ID:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={scanInputId} 
                  onChange={(e) => setScanInputId(e.target.value)}
                  placeholder="e.g. BATCH-TN-2026-TOM-001"
                  className="form-input"
                  style={{ flex: 1, padding: '10px 14px' }}
                />
                <button 
                  onClick={() => handleScanLookup(scanInputId)}
                  disabled={loading}
                  style={{ background: '#108e56', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {loading ? 'Scanning...' : 'Scan QR'}
                </button>
              </div>

              {/* Fast presets */}
              <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#4b6357', fontWeight: 600 }}>Quick Preset:</span>
                <button 
                  onClick={() => { setScanInputId('BATCH-TN-2026-TOM-001'); handleScanLookup('BATCH-TN-2026-TOM-001'); }}
                  style={{ fontSize: '0.75rem', background: '#ecfdf5', border: '1px solid #34d399', color: '#059669', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  BATCH-TN-2026-TOM-001 (500kg Tomato)
                </button>
              </div>
            </div>

            {currentBatch && (
              <div style={{ background: '#ffffff', border: '1px solid #e2ece6', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0a2f1d' }}>
                    Batch Inspection Checklist
                  </div>
                  <span className={`badge ${verifiedState ? 'badge-success' : 'badge-warning'}`}>
                    {verifiedState ? 'Quality Certified' : 'Awaiting Buyer Acceptance'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
                    <CheckCircle size={16} /> <span>Cold transit temperature maintained (&lt; 26°C)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
                    <CheckCircle size={16} /> <span>Weight verified: {currentBatch.total_quantity_kg} kg net produce</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
                    <CheckCircle size={16} /> <span>Grade inspection: {currentBatch.quality_grade} criteria satisfied</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
                    <CheckCircle size={16} /> <span>Farmers provenance: {currentBatch.farmer_names}</span>
                  </div>
                </div>

                {verifiedState ? (
                  <div style={{ marginTop: '16px', padding: '14px', background: '#ecfdf5', borderRadius: '10px', border: '1px solid #34d399', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <ShieldCheck size={20} /> Produce Verified & Accepted!
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#065f46', marginTop: '4px' }}>
                      Escrow milestone 4 complete. Funds ready for instant payout release to farmers.
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '16px' }}>
                    <button 
                      onClick={handleAcceptInspection}
                      disabled={loading}
                      className="btn-rural btn-rural-gold"
                      style={{ width: '100%', minHeight: '48px', fontSize: '0.98rem' }}
                    >
                      <UserCheck size={20} /> Verify & Accept Produce (Buyer Action)
                    </button>
                    <div style={{ fontSize: '0.78rem', color: '#4b6357', textAlign: 'center', marginTop: '6px' }}>
                      Clicking this simulates the buyer scanning the physical crate QR on arrival.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
