import React, { useState } from 'react';
import { Play, CheckCircle2, ArrowRight, ShieldCheck, Truck, QrCode, Banknote, Users, Sparkles, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SIHDemoFlowModal({ isOpen, onClose, onNavigateView }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const flowSteps = [
    {
      id: 1,
      title: "1. Farmer Logs In & Lists Produce",
      titleTamil: "1. விவசாயி உள்நுழைந்து பயிரைப் பட்டியலிடுகிறார்",
      actor: "Farmer: Muthuvel (Kinathukadavu)",
      description: "Smallholder farmer logs 100 kg of fresh Grade A Tomato. Base cost is ₹18/kg.",
      actionLabel: "View Produce in Farmer Dashboard",
      targetView: "farmer_dash",
      icon: "🌾"
    },
    {
      id: 2,
      title: "2. AI Predicts Demand & Recommends Harvest Window",
      titleTamil: "2. AI எதிர்கால தேவையையும் அறுவடை காலத்தையும் கணிக்கிறது",
      actor: "AgriBridge AI Forecasting Model",
      description: "RandomForestRegressor & seasonal time-series analysis predict HIGH demand with a 5–10 day harvest window and ₹28–₹32/kg price range.",
      actionLabel: "Inspect AI Demand Charts",
      targetView: "forecast",
      icon: "📈"
    },
    {
      id: 3,
      title: "3. Transparent AI Fair Price Calculation",
      titleTamil: "3. வெளிப்படையான AI நியாய விலை கணக்கீடு",
      actor: "Fair Price Formula Engine",
      description: "Formula: ₹18 (Production) + ₹4 (Demand Adj) + ₹3 (Quality Adj) + ₹4 (Logistics) = Suggested Fair Price of ₹29/kg. Guarantees 35% net profit margin.",
      actionLabel: "Open Fair Price Calculator",
      targetView: "fair_price",
      icon: "⚖️"
    },
    {
      id: 4,
      title: "4. Buyer Posts Requirement (Reverse Marketplace)",
      titleTamil: "4. வாங்குபவர் தேவையை வெளியிடுகிறார் (ரிவர்ஸ் சந்தை)",
      actor: "Buyer: Coimbatore Agro Fresh Wholesale",
      description: "Demand-First Innovation: Enterprise buyer specifies 1000 kg Grade A Tomato at ₹30/kg at Coimbatore Agro-Wholesale Market by Sept 30.",
      actionLabel: "View Reverse Marketplace Post",
      targetView: "marketplace",
      icon: "🛒"
    },
    {
      id: 5,
      title: "5. Virtual FPO Dynamic Aggregation",
      titleTamil: "5. விர்ச்சுவல் FPO விளைச்சல் திரட்டல்",
      actor: "Kongu Virtual FPO Co-op",
      description: "Core Innovation: Combining Farmer A (100 kg) + Farmer B (150 kg) + Farmer C (250 kg) = 500 kg Buyer-Ready Bulk Order!",
      actionLabel: "Inspect Virtual FPO Bulk Pool",
      targetView: "vfpo",
      icon: "🤝"
    },
    {
      id: 6,
      title: "6. Smart Logistics Route & Spoilage Optimization",
      titleTamil: "6. ஸ்மார்ட் கூட்டுப் போக்குவரத்து & அழுகல் குறைப்பு",
      actor: "Google OR-Tools Compatible Logistics Engine",
      description: "Multi-stop pickup scheduled: Kinathukadavu -> Negamam -> Sulur -> Pollachi Hub -> Coimbatore Buyer. Spoilage risk reduced to 5.2%. Saves ₹4,130 in fuel!",
      actionLabel: "View GIS Route Map",
      targetView: "logistics",
      icon: "🚛"
    },
    {
      id: 7,
      title: "7. Farm-to-Fork QR Batch Generation",
      titleTamil: "7. பண்ணை முதல் நுகர்வோர் வரை QR சுவடு",
      actor: "Tamper-Evident QR Traceability Engine",
      description: "Batch ID 'BATCH-TN-2026-TOM-001' generated with cryptographic digital signature. Encodes 3 farmer IDs, quality certification, and harvest timestamps.",
      actionLabel: "View Batch QR Code",
      targetView: "qr",
      icon: "🔲"
    },
    {
      id: 8,
      title: "8. Escrow Payment Deposited & Produce Dispatched",
      titleTamil: "8. எஸ்க்ரோவில் பணம் வைப்பு & சரக்கு அனுப்பப்பட்டது",
      actor: "Secure Escrow State Machine",
      description: "Buyer deposits ₹14,500 into neutral Escrow account. Produce collected from farms and dispatched via insulated carrier.",
      actionLabel: "Check Escrow Stepper",
      targetView: "payments",
      icon: "🔒"
    },
    {
      id: 9,
      title: "9. Produce Arrival & QR Verification Scan",
      titleTamil: "9. சரக்கு வந்து சேர்தல் & QR சரிபார்த்தல்",
      actor: "Buyer Quality Inspector",
      description: "Buyer scans batch QR code at destination warehouse. Cold-chain log and Grade A physical criteria verified and accepted.",
      actionLabel: "Inspect Verification Status",
      targetView: "qr",
      icon: "🔍"
    },
    {
      id: 10,
      title: "10. Escrow Released Directly to All 3 Farmers!",
      titleTamil: "10. விவசாயிகளுக்குப் பணம் உடனே விடுவிக்கப்பட்டது!",
      actor: "Direct Benefit Transfer / Escrow Disbursal",
      description: "Payment instantly unlocked! Farmer A receives ₹2,900 (20%), Farmer B receives ₹4,350 (30%), Farmer C receives ₹7,250 (50%). Intermediary commission eliminated!",
      actionLabel: "View Final Settlement",
      targetView: "payments",
      icon: "🎉"
    }
  ];

  const handleNext = () => {
    if (currentStep < flowSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      if (currentStep === flowSteps.length - 2) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleJumpToView = (viewName) => {
    if (onNavigateView) {
      onNavigateView(viewName);
      onClose();
    }
  };

  const step = flowSteps[currentStep];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 47, 29, 0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '20px' }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', maxWidth: '780px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '32px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #e2ece6', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>SIH26033 OFFICIAL DEMO</span>
              <span style={{ fontSize: '0.85rem', color: '#108e56', fontWeight: 700 }}>AgriBridge AI</span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0a2f1d', marginTop: '4px' }}>
              Complete 10-Step Farm-to-Fork Walkthrough
            </h2>
            <div style={{ fontSize: '0.84rem', color: '#4b6357' }}>
              Farmer → Virtual FPO → Buyer (Zero Middlemen Guarantee)
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f3', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>

        {/* Horizontal Step Indicator Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
          {flowSteps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              style={{
                flexShrink: 0,
                padding: '6px 12px',
                borderRadius: '20px',
                border: currentStep === idx ? '2px solid #10b981' : '1px solid #cbdcd3',
                background: currentStep === idx ? '#ecfdf5' : '#ffffff',
                color: currentStep === idx ? '#059669' : '#4b6357',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{s.icon}</span>
              <span>Step {s.id}</span>
            </button>
          ))}
        </div>

        {/* Active Step Presentation Card */}
        <div style={{ background: 'linear-gradient(135deg, #f8faf9 0%, #ecfdf5 100%)', borderRadius: '20px', border: '1.5px solid #34d399', padding: '28px', marginBottom: '24px', position: 'relative' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#108e56', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', boxShadow: '0 4px 14px rgba(16, 142, 86, 0.3)' }}>
              {step.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#059669', fontWeight: 800 }}>
                {step.actor}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0a2f1d' }}>
                {step.title}
              </h3>
              <div style={{ fontSize: '0.9rem', color: '#108e56', fontWeight: 600 }}>
                {step.titleTamil}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.98rem', color: '#0f241a', lineHeight: 1.6, marginBottom: '20px', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #cbdcd3' }}>
            {step.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <button
              onClick={() => handleJumpToView(step.targetView)}
              style={{ background: '#0a2f1d', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>🚀 {step.actionLabel}</span>
              <ArrowRight size={14} />
            </button>
            <span style={{ fontSize: '0.82rem', color: '#4b6357', fontWeight: 600 }}>
              Milestone {step.id} of 10
            </span>
          </div>

        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="btn-rural btn-rural-secondary"
            style={{ minHeight: '44px', fontSize: '0.92rem', padding: '10px 20px', opacity: currentStep === 0 ? 0.4 : 1 }}
          >
            ← Previous Step
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep === flowSteps.length - 1 ? (
              <button
                onClick={() => {
                  confetti({ particleCount: 150, spread: 90 });
                  onClose();
                }}
                className="btn-rural btn-rural-gold"
                style={{ minHeight: '44px', fontSize: '0.95rem', padding: '10px 24px' }}
              >
                🎉 Complete SIH Demo Presentation!
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="btn-rural btn-rural-primary"
                style={{ minHeight: '44px', fontSize: '0.95rem', padding: '10px 24px' }}
              >
                Next Step →
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
