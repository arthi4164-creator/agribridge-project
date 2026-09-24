import React, { useState, useEffect } from 'react';
import { 
  Sprout, Users, ShoppingCart, Shield, ArrowRight, TrendingUp, Calculator, 
  Truck, QrCode, CreditCard, Bot, Bell, Settings, Plus, CheckCircle2, 
  MapPin, Calendar, Clock, DollarSign, Award, ChevronRight, AlertTriangle, 
  Layers, Package, Sparkles, Filter, Globe, Play, UserCheck, Eye, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { t } from './translations';
import SmartRouteMap from './components/SmartRouteMap';
import QRTraceabilityModal from './components/QRTraceabilityModal';
import AIAssistantWidget from './components/AIAssistantWidget';
import SIHDemoFlowModal from './components/SIHDemoFlowModal';

export default function App() {
  // Navigation & Role State
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'farmer_dash', 'fpo_dash', 'buyer_dash', 'admin_dash', 'forecast', 'marketplace', 'req_detail', 'vfpo', 'fair_price', 'logistics', 'qr', 'payments', 'orders', 'assistant', 'crops', 'profile', 'notifications', 'login', 'register'
  const [currentRole, setCurrentRole] = useState('farmer'); // 'farmer', 'fpo', 'buyer', 'admin'
  const [lang, setLang] = useState('en'); // 'en' or 'ta'

  // Modals & Floating Widgets
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isDemoFlowOpen, setIsDemoFlowOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Core Data Collections
  const [crops, setCrops] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [selectedForecastCrop, setSelectedForecastCrop] = useState('Tomato');
  const [selectedForecast, setSelectedForecast] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [vfpoGroups, setVfpoGroups] = useState([]);
  const [produceList, setProduceList] = useState([]);
  const [logisticsRoutes, setLogisticsRoutes] = useState([]);
  const [qrBatches, setQrBatches] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fair Price Calculator Interactive Inputs
  const [calcCrop, setCalcCrop] = useState('Tomato');
  const [calcQty, setCalcQty] = useState(500);
  const [calcCost, setCalcCost] = useState(18);
  const [calcGrade, setCalcGrade] = useState('Grade A');
  const [calcDemand, setCalcDemand] = useState('High');
  const [calcDist, setCalcDist] = useState(35);
  const [calcResult, setCalcResult] = useState(null);

  // Forms State
  const [newProduceForm, setNewProduceForm] = useState({
    crop_name: 'Tomato',
    quantity_kg: 200,
    quality_grade: 'Grade A',
    expected_price_per_kg: 29,
    location: 'Kinathukadavu',
    harvest_date: new Date(Date.now() + 3*86400000).toISOString().split('T')[0]
  });

  const [newReqForm, setNewReqForm] = useState({
    crop_name: 'Tomato',
    required_quantity_kg: 1000,
    quality_grade: 'Grade A',
    max_price_per_kg: 30,
    delivery_location: 'Coimbatore Wholesale Hub',
    delivery_district: 'Coimbatore',
    required_date: new Date(Date.now() + 7*86400000).toISOString().split('T')[0]
  });

  const [respondForm, setRespondForm] = useState({
    offered_quantity_kg: 500,
    offered_price_per_kg: 29,
    quality_grade: 'Grade A',
    delivery_date: new Date(Date.now() + 4*86400000).toISOString().split('T')[0]
  });

  const dict = t[lang] || t['en'];

  // Initial Data Fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [cropsRes, foreRes, reqRes, vfpoRes, prodRes, logRes, qrRes, payRes, notifRes] = await Promise.all([
        fetch('/api/crops').catch(() => null),
        fetch('/api/forecast/crops').catch(() => null),
        fetch('/api/marketplace/requirements').catch(() => null),
        fetch('/api/virtual-fpo/groups').catch(() => null),
        fetch('/api/produce').catch(() => null),
        fetch('/api/logistics/routes').catch(() => null),
        fetch('/api/qr/batches').catch(() => null),
        fetch('/api/payments').catch(() => null),
        fetch('/api/notifications').catch(() => null),
      ]);

      if (cropsRes?.ok) setCrops(await cropsRes.json());
      if (foreRes?.ok) {
        const foreData = await foreRes.json();
        setForecasts(foreData);
        const tom = foreData.find(f => f.crop === 'Tomato') || foreData[0];
        setSelectedForecast(tom);
      }
      if (reqRes?.ok) setRequirements(await reqRes.json());
      if (vfpoRes?.ok) setVfpoGroups(await vfpoRes.json());
      if (prodRes?.ok) setProduceList(await prodRes.json());
      if (logRes?.ok) setLogisticsRoutes(await logRes.json());
      if (qrRes?.ok) setQrBatches(await qrRes.json());
      if (payRes?.ok) setPayments(await payRes.json());
      if (notifRes?.ok) setNotifications(await notifRes.json());

      // Auto calculate fair price initial
      calculateFairPrice(calcCrop, calcQty, calcCost, calcGrade, calcDemand, calcDist);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateFairPrice = async (crop, qty, cost, grade, demand, dist) => {
    try {
      const res = await fetch('/api/fair-price/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop_name: crop,
          quantity_kg: Number(qty),
          quality_grade: grade,
          production_cost: Number(cost),
          demand_level: demand,
          distance_km: Number(dist)
        })
      });
      if (res.ok) {
        setCalcResult(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleSwitch = (role) => {
    setCurrentRole(role);
    if (role === 'farmer') setCurrentView('farmer_dash');
    else if (role === 'fpo') setCurrentView('fpo_dash');
    else if (role === 'buyer') setCurrentView('buyer_dash');
    else if (role === 'admin') setCurrentView('admin_dash');
  };

  const handleAddProduce = async (e) => {
    e?.preventDefault();
    try {
      const res = await fetch('/api/produce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: 1,
          ...newProduceForm
        })
      });
      if (res.ok) {
        confetti({ particleCount: 50, spread: 60 });
        alert(lang === 'ta' ? "பயிர் வெற்றிகரமாக பட்டியலிடப்பட்டது!" : "Crop listed successfully on AgriBridge!");
        fetchAllData();
        setCurrentView('farmer_dash');
      }
    } catch (err) {
      alert("Error adding produce");
    }
  };

  const handleCreateRequirement = async (e) => {
    e?.preventDefault();
    try {
      const res = await fetch('/api/marketplace/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_id: 6,
          ...newReqForm
        })
      });
      if (res.ok) {
        confetti({ particleCount: 60, spread: 70 });
        alert(lang === 'ta' ? "வாங்குபவர் தேவை வெற்றிகரமாக வெளியிடப்பட்டது!" : "Requirement posted successfully on Reverse Marketplace!");
        fetchAllData();
        setCurrentView('marketplace');
      }
    } catch (err) {
      alert("Error posting requirement");
    }
  };

  const handleRespondRequirement = async (reqId) => {
    try {
      const res = await fetch(`/api/marketplace/requirements/${reqId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirement_id: reqId,
          respondent_id: 1,
          respondent_type: 'Virtual FPO',
          ...respondForm
        })
      });
      if (res.ok) {
        confetti({ particleCount: 70, spread: 80 });
        alert(lang === 'ta' ? "விருப்பம் வாங்குபவருக்கு அனுப்பப்பட்டது!" : "Offer sent to buyer successfully!");
        fetchAllData();
      }
    } catch (err) {
      alert("Error responding to requirement");
    }
  };

  const handleJoinVfpo = async (groupId) => {
    try {
      const res = await fetch('/api/virtual-fpo/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: groupId,
          farmer_id: 4, // Farmer D
          crop_name: 'Tomato',
          quantity_kg: 150,
          quality_grade: 'Grade A',
          price_per_kg: 29.0,
          farmer_location: 'Thondamuthur'
        })
      });
      if (res.ok) {
        const data = await res.json();
        confetti({ particleCount: 80, spread: 70 });
        alert(data.message);
        fetchAllData();
      }
    } catch (err) {
      alert("Error joining Virtual FPO");
    }
  };

  const handleAdvancePayment = async (paymentId) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}/advance`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.stage === 5) {
          confetti({ particleCount: 150, spread: 100 });
        }
        alert(data.message);
        fetchAllData();
      }
    } catch (err) {
      alert("Error advancing payment milestone");
    }
  };

  const handleAssistantAutoFill = (formData) => {
    setNewProduceForm({
      ...newProduceForm,
      crop_name: formData.crop || 'Tomato',
      quantity_kg: formData.quantity_kg || 200,
      location: formData.location || 'Coimbatore'
    });
    setCalcCrop(formData.crop || 'Tomato');
    setCalcQty(formData.quantity_kg || 200);
    calculateFairPrice(formData.crop || 'Tomato', formData.quantity_kg || 200, calcCost, calcGrade, calcDemand, calcDist);
    setCurrentView('farmer_dash');
    setIsAssistantOpen(false);
    confetti({ particleCount: 60, spread: 70 });
  };

  return (
    <div className="app-shell">
      
      {/* 1. DEMO & ROLE SWITCHER BAR (STICKY TOP FOR SIH JUDGES) */}
      <div className="demo-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="demo-pill">
            <Sparkles size={14} /> SIH26033 Problem Solver
          </span>
          <span style={{ fontSize: '0.82rem', color: '#a3c2b2', fontWeight: 500 }}>
            Farm-to-Market Network (Zero Intermediaries)
          </span>
        </div>

        <div className="role-switcher-group">
          <span style={{ fontSize: '0.78rem', color: '#d1fae5', marginRight: '4px' }}>Active Role:</span>
          <button 
            onClick={() => handleRoleSwitch('farmer')} 
            className={`role-btn ${currentRole === 'farmer' ? 'active' : ''}`}
          >
            🌾 {dict.roleFarmer}
          </button>
          <button 
            onClick={() => handleRoleSwitch('fpo')} 
            className={`role-btn ${currentRole === 'fpo' ? 'active' : ''}`}
          >
            🏢 {dict.roleFpo}
          </button>
          <button 
            onClick={() => handleRoleSwitch('buyer')} 
            className={`role-btn ${currentRole === 'buyer' ? 'active' : ''}`}
          >
            🛒 {dict.roleBuyer}
          </button>
          <button 
            onClick={() => handleRoleSwitch('admin')} 
            className={`role-btn ${currentRole === 'admin' ? 'active' : ''}`}
          >
            🛡️ {dict.roleAdmin}
          </button>

          <button 
            onClick={() => setIsDemoFlowOpen(true)}
            className="demo-flow-btn"
          >
            <Play size={14} fill="#ffffff" /> 1-Click SIH Demo Walkthrough
          </button>

          <button 
            onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
            className="lang-toggle-btn"
          >
            <Globe size={13} style={{ display: 'inline', marginRight: '4px' }} />
            {lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}
          </button>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION BAR */}
      <header className="main-navbar">
        <div className="brand-section" onClick={() => setCurrentView('landing')}>
          <div className="brand-logo-icon">🌾</div>
          <div>
            <div className="brand-title">
              {dict.appName}
              <span className="brand-badge">SIH26033</span>
            </div>
            <div className="brand-tagline">
              {dict.tagline}
            </div>
          </div>
        </div>

        <nav>
          <ul className="nav-links">
            <li>
              <button 
                onClick={() => setCurrentView('landing')} 
                className={`nav-link-btn ${currentView === 'landing' ? 'active' : ''}`}
              >
                {dict.navHome}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView(currentRole === 'farmer' ? 'farmer_dash' : currentRole === 'fpo' ? 'fpo_dash' : currentRole === 'buyer' ? 'buyer_dash' : 'admin_dash')} 
                className={`nav-link-btn ${['farmer_dash', 'fpo_dash', 'buyer_dash', 'admin_dash'].includes(currentView) ? 'active' : ''}`}
              >
                Dashboard
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('marketplace')} 
                className={`nav-link-btn ${currentView === 'marketplace' ? 'active' : ''}`}
              >
                {dict.navMarketplace}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('vfpo')} 
                className={`nav-link-btn ${currentView === 'vfpo' ? 'active' : ''}`}
              >
                {dict.navVfpo}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('forecast')} 
                className={`nav-link-btn ${currentView === 'forecast' ? 'active' : ''}`}
              >
                {dict.navForecast}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('fair_price')} 
                className={`nav-link-btn ${currentView === 'fair_price' ? 'active' : ''}`}
              >
                {dict.navFairPrice}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('logistics')} 
                className={`nav-link-btn ${currentView === 'logistics' ? 'active' : ''}`}
              >
                {dict.navLogistics}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('qr')} 
                className={`nav-link-btn ${currentView === 'qr' ? 'active' : ''}`}
              >
                {dict.navQr}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('payments')} 
                className={`nav-link-btn ${currentView === 'payments' ? 'active' : ''}`}
              >
                {dict.navPayments}
              </button>
            </li>
          </ul>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className="btn-rural btn-rural-gold"
            style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.86rem' }}
          >
            <Bot size={16} /> {dict.askAi}
          </button>
          
          <button 
            onClick={() => setCurrentView('notifications')}
            style={{ position: 'relative', background: '#f1f5f3', border: '1px solid #cbdcd3', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Bell size={18} color="#0f241a" />
            <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#dc2626', color: '#fff', fontSize: '0.65rem', fontWeight: 800, width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {notifications.length || 4}
            </span>
          </button>
        </div>
      </header>

      {/* 3. MAIN DYNAMIC VIEW ROUTER */}
      <main className="main-content">
        
        {/* ==========================================
            VIEW 1: LANDING PAGE & INNOVATION HIGHLIGHTS
            ========================================== */}
        {currentView === 'landing' && (
          <div>
            {/* Hero Section */}
            <div style={{ background: 'linear-gradient(135deg, #0a2f1d 0%, #12472d 60%, #18633f 100%)', borderRadius: '24px', padding: '48px 36px', color: '#ffffff', marginBottom: '36px', boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '-20px', top: '-20px', fontSize: '14rem', opacity: 0.06, pointerEvents: 'none' }}>
                🌾
              </div>
              <div style={{ maxWidth: '820px', position: 'relative', zIndex: 2 }}>
                <span className="badge badge-success" style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#6ee7b7', border: '1px solid rgba(52, 211, 153, 0.4)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  SIH26033 Solution Architecture
                </span>
                <h1 style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '16px', color: '#ffffff' }}>
                  AgriBridge AI
                </h1>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 600, color: '#a3c2b2', marginBottom: '20px' }}>
                  Virtual FPO + AI-Powered Farm-to-Market Network
                </h2>
                <p style={{ fontSize: '1.15rem', color: '#e2ece6', lineHeight: 1.6, marginBottom: '32px' }}>
                  “Connect farmers directly with buyers, predict demand, aggregate produce, optimize logistics and enable transparent agricultural transactions.”
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleRoleSwitch('farmer')}
                    className="btn-rural btn-rural-gold"
                    style={{ fontSize: '1.1rem', padding: '14px 28px' }}
                  >
                    🌾 Get Started as Farmer
                  </button>
                  <button 
                    onClick={() => setCurrentView('marketplace')}
                    className="btn-rural btn-rural-secondary"
                    style={{ fontSize: '1.1rem', padding: '14px 28px', background: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    🛒 Explore Reverse Marketplace
                  </button>
                  <button 
                    onClick={() => setIsDemoFlowOpen(true)}
                    className="btn-rural btn-rural-primary"
                    style={{ fontSize: '1.1rem', padding: '14px 28px' }}
                  >
                    ⚡ Interactive SIH Demo Walkthrough
                  </button>
                </div>
              </div>

              {/* Three User Role Cards */}
              <div className="grid-3" style={{ marginTop: '40px', position: 'relative', zIndex: 2 }}>
                <div 
                  onClick={() => handleRoleSwitch('farmer')}
                  style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px', padding: '22px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌾</div>
                  <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '6px' }}>For Farmers</h3>
                  <p style={{ fontSize: '0.88rem', color: '#d1fae5', lineHeight: 1.5 }}>
                    Sell produce directly, join Virtual FPO pooling, check AI harvest predictions, and receive guaranteed escrow payouts.
                  </p>
                </div>

                <div 
                  onClick={() => handleRoleSwitch('fpo')}
                  style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px', padding: '22px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏢</div>
                  <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '6px' }}>For Virtual FPOs</h3>
                  <p style={{ fontSize: '0.88rem', color: '#d1fae5', lineHeight: 1.5 }}>
                    Aggregate smallholder quantities into 500kg–5,000kg bulk orders, plan shared logistics, and track transparent farmer splits.
                  </p>
                </div>

                <div 
                  onClick={() => handleRoleSwitch('buyer')}
                  style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px', padding: '22px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🛒</div>
                  <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '6px' }}>For Bulk Buyers</h3>
                  <p style={{ fontSize: '0.88rem', color: '#d1fae5', lineHeight: 1.5 }}>
                    Post enterprise demand first, procure farm-fresh graded produce, verify batches via QR scan, and protect funds with escrow.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION: 5 UNIQUE INNOVATIONS (AS MANDATED BY SIH PROBLEM STATEMENT) */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 32px' }}>
                <span className="badge badge-success" style={{ marginBottom: '10px' }}>Core Problem Solver</span>
                <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0a2f1d' }}>
                  5 Groundbreaking Innovations
                </h2>
                <p style={{ color: '#4b6357', fontSize: '1.05rem', marginTop: '6px' }}>
                  Solving: <em>“Multiple intermediaries reduce farmers' earnings and increase consumer prices.”</em>
                </p>
              </div>

              <div className="grid-3">
                {/* Innovation 1 */}
                <div className="card-clean" style={{ borderTop: '4px solid #10b981' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '14px' }}>
                    🔄
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#0a2f1d' }}>
                    1. Reverse Marketplace
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: '#4b6357', lineHeight: 1.5, marginBottom: '14px' }}>
                    <strong>Buyer posts demand first!</strong> Instead of farmers blindly dumping harvest at mandis, institutional buyers specify crop, quantity, quality, and delivery dates.
                  </p>
                  <button onClick={() => setCurrentView('marketplace')} style={{ background: 'none', border: 'none', color: '#108e56', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Explore Reverse Marketplace <ArrowRight size={14} />
                  </button>
                </div>

                {/* Innovation 2 */}
                <div className="card-clean" style={{ borderTop: '4px solid #f59e0b' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '14px' }}>
                    📈
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#0a2f1d' }}>
                    2. AI Demand Forecasting
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: '#4b6357', lineHeight: 1.5, marginBottom: '14px' }}>
                    Scikit-learn, Pandas & NumPy models forecast future demand trends, expected market price (₹28–₹32/kg for Tomato), and the optimal 5–10 day harvest window.
                  </p>
                  <button onClick={() => setCurrentView('forecast')} style={{ background: 'none', border: 'none', color: '#d97706', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    View Forecast Charts <ArrowRight size={14} />
                  </button>
                </div>

                {/* Innovation 3 */}
                <div className="card-clean" style={{ borderTop: '4px solid #0284c7' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '14px' }}>
                    🤝
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#0a2f1d' }}>
                    3. Dynamic Aggregation (Virtual FPO)
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: '#4b6357', lineHeight: 1.5, marginBottom: '14px' }}>
                    <strong>100kg + 150kg + 250kg = 500kg Bulk Order!</strong> Smallholder farmers digitally aggregate without legal bureaucracy, unlocking large corporate orders.
                  </p>
                  <button onClick={() => setCurrentView('vfpo')} style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Inspect Virtual FPO Pools <ArrowRight size={14} />
                  </button>
                </div>

                {/* Innovation 4 */}
                <div className="card-clean" style={{ borderTop: '4px solid #7c3aed' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '14px' }}>
                    🚛
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#0a2f1d' }}>
                    4. Smart Logistics & Spoilage Reduction
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: '#4b6357', lineHeight: 1.5, marginBottom: '14px' }}>
                    Google OR-Tools compatible route solver groups nearby farmer pickups into a single vehicle, cutting transport costs by 74% and spoilage risk to 5.2%.
                  </p>
                  <button onClick={() => setCurrentView('logistics')} style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Simulate Route Solver <ArrowRight size={14} />
                  </button>
                </div>

                {/* Innovation 5 */}
                <div className="card-clean" style={{ borderTop: '4px solid #059669' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '14px' }}>
                    🔲
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#0a2f1d' }}>
                    5. QR Traceability & Escrow Protection
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: '#4b6357', lineHeight: 1.5, marginBottom: '14px' }}>
                    Every batch has a tamper-evident QR code showing farm provenance, harvest dates, and quality grade. Buyer QR scan automatically triggers escrow payout.
                  </p>
                  <button onClick={() => setCurrentView('qr')} style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Scan & Verify Batch <ArrowRight size={14} />
                  </button>
                </div>

                {/* Innovation 6: Transparent Pricing */}
                <div className="card-clean" style={{ borderTop: '4px solid #ea580c' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '14px' }}>
                    ⚖️
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#0a2f1d' }}>
                    Transparent Fair Price Formula
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: '#4b6357', lineHeight: 1.5, marginBottom: '14px' }}>
                    <strong>Production + Demand + Quality + Logistics = Fair Price.</strong> Both farmer and buyer see the mathematical justification behind every rupee.
                  </p>
                  <button onClick={() => setCurrentView('fair_price')} style={{ background: 'none', border: 'none', color: '#ea580c', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Try Price Calculator <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* End to End Workflow Stepper Preview */}
            <div className="card-clean" style={{ padding: '32px', marginBottom: '30px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span className="badge badge-info">SIH26033 Problem Flow</span>
                <h3 style={{ fontSize: '1.6rem', color: '#0a2f1d', marginTop: '6px' }}>
                  How AgriBridge AI Eliminates Unnecessary Middlemen
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#f8faf9', padding: '18px', borderRadius: '12px', border: '1px solid #e2ece6', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🌾</div>
                  <div style={{ fontWeight: 800, color: '#0a2f1d' }}>1. Farmer Lists Crop</div>
                  <div style={{ fontSize: '0.82rem', color: '#4b6357', marginTop: '4px' }}>Smallholder enters quantity & receives AI harvest window.</div>
                </div>

                <div style={{ background: '#f8faf9', padding: '18px', borderRadius: '12px', border: '1px solid #e2ece6', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🛒</div>
                  <div style={{ fontWeight: 800, color: '#0a2f1d' }}>2. Buyer Demand First</div>
                  <div style={{ fontSize: '0.82rem', color: '#4b6357', marginTop: '4px' }}>Enterprise buyers post required tonnage on Reverse Marketplace.</div>
                </div>

                <div style={{ background: '#f8faf9', padding: '18px', borderRadius: '12px', border: '1px solid #e2ece6', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🤝</div>
                  <div style={{ fontWeight: 800, color: '#0a2f1d' }}>3. Virtual FPO Pools</div>
                  <div style={{ fontSize: '0.82rem', color: '#4b6357', marginTop: '4px' }}>Multiple farmers' small lots combined into bulk fulfillment.</div>
                </div>

                <div style={{ background: '#f8faf9', padding: '18px', borderRadius: '12px', border: '1px solid #e2ece6', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🚛</div>
                  <div style={{ fontWeight: 800, color: '#0a2f1d' }}>4. Smart Transit</div>
                  <div style={{ fontSize: '0.82rem', color: '#4b6357', marginTop: '4px' }}>Optimized shared truck route minimizes spoilage and fuel.</div>
                </div>

                <div style={{ background: '#f8faf9', padding: '18px', borderRadius: '12px', border: '1px solid #e2ece6', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '6px' }}>💳</div>
                  <div style={{ fontWeight: 800, color: '#0a2f1d' }}>5. QR Scan & Escrow</div>
                  <div style={{ fontSize: '0.82rem', color: '#4b6357', marginTop: '4px' }}>Buyer scans QR batch, confirming quality. Farmers paid directly!</div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            VIEW 2: FARMER DASHBOARD (RURAL FRIENDLY)
            ========================================== */}
        {currentView === 'farmer_dash' && (
          <div>
            {/* Welcome Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                  🌾 {dict.roleFarmer}: Muthuvel (Kinathukadavu)
                </span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0a2f1d' }}>
                  {dict.welcome}
                </h1>
                <p style={{ color: '#4b6357', fontSize: '1rem' }}>
                  {dict.welcomeFarmer} • Land Holding: 3.5 Acres • Bank DBT Linked
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setIsAssistantOpen(true)}
                  className="btn-rural btn-rural-gold"
                  style={{ minHeight: '46px', fontSize: '0.95rem' }}
                >
                  <Bot size={18} /> {dict.askAi}
                </button>
              </div>
            </div>

            {/* AI Recommendation Alert Card */}
            <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1.5px solid #34d399', borderRadius: '16px', padding: '18px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#108e56', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                  💡
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#065f46', fontSize: '1.05rem' }}>
                    {dict.aiRecommendation}
                  </div>
                  <div style={{ color: '#0a2f1d', fontSize: '0.95rem', marginTop: '2px' }}>
                    {lang === 'ta'
                      ? "தக்காளி தேவை அதிகமாக உள்ளது. அடுத்த 5–10 நாட்களில் அறுவடை செய்து விற்பனை செய்ய பரிந்துரைக்கப்படுகிறது (எதிர்பார்க்கப்படும் விலை ₹28–₹32/கிலோ)."
                      : "Tomato demand is expected to increase! Consider harvesting within the recommended 5–10 day window to capture ₹28–₹32/kg."
                    }
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setCurrentView('forecast')}
                style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                View Details →
              </button>
            </div>

            {/* Quick Action Large Buttons (Rural-Friendly 48px+ touch targets) */}
            <div className="card-clean" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#0a2f1d', marginBottom: '16px', fontWeight: 700 }}>
                ⚡ Quick Actions (விரைவுச் செயல்கள்)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
                <button 
                  onClick={() => {
                    const el = document.getElementById('add-crop-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-rural btn-rural-primary"
                  style={{ fontSize: '0.95rem' }}
                >
                  <Plus size={18} /> {dict.sellCrop}
                </button>
                <button 
                  onClick={() => setCurrentView('marketplace')}
                  className="btn-rural btn-rural-secondary"
                  style={{ fontSize: '0.95rem' }}
                >
                  <ShoppingCart size={18} /> {dict.findBuyers}
                </button>
                <button 
                  onClick={() => setCurrentView('forecast')}
                  className="btn-rural btn-rural-secondary"
                  style={{ fontSize: '0.95rem' }}
                >
                  <TrendingUp size={18} /> {dict.demandForecast}
                </button>
                <button 
                  onClick={() => setCurrentView('fair_price')}
                  className="btn-rural btn-rural-secondary"
                  style={{ fontSize: '0.95rem' }}
                >
                  <Calculator size={18} /> {dict.checkPrice}
                </button>
                <button 
                  onClick={() => setCurrentView('vfpo')}
                  className="btn-rural btn-rural-secondary"
                  style={{ fontSize: '0.95rem' }}
                >
                  <Users size={18} /> {dict.joinVfpo}
                </button>
                <button 
                  onClick={() => setCurrentView('logistics')}
                  className="btn-rural btn-rural-secondary"
                  style={{ fontSize: '0.95rem' }}
                >
                  <Truck size={18} /> {dict.transport}
                </button>
                <button 
                  onClick={() => setCurrentView('payments')}
                  className="btn-rural btn-rural-secondary"
                  style={{ fontSize: '0.95rem' }}
                >
                  <CreditCard size={18} /> {dict.myPayment}
                </button>
                <button 
                  onClick={() => setIsQrModalOpen(true)}
                  className="btn-rural btn-rural-secondary"
                  style={{ fontSize: '0.95rem' }}
                >
                  <QrCode size={18} /> {dict.scanQr}
                </button>
              </div>
            </div>

            {/* Dashboard Status Metric Cards */}
            <div className="grid-4" style={{ marginBottom: '24px' }}>
              <div className="card-clean">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#4b6357', fontWeight: 600 }}>{dict.availableCrop}</span>
                  <span style={{ fontSize: '1.4rem' }}>🍅</span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0a2f1d' }}>
                  500 <span style={{ fontSize: '1rem', fontWeight: 600 }}>kg Tomato</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                  ✓ 100 kg in Virtual FPO • 400 kg Available
                </div>
              </div>

              <div className="card-clean">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#4b6357', fontWeight: 600 }}>{dict.currentDemand}</span>
                  <span style={{ fontSize: '1.4rem' }}>📈</span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>
                  High (↑ 18%)
                </div>
                <div style={{ fontSize: '0.78rem', color: '#4b6357', fontWeight: 600, marginTop: '4px' }}>
                  Coimbatore wholesale arrivals tight
                </div>
              </div>

              <div className="card-clean">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#4b6357', fontWeight: 600 }}>{dict.expectedPrice}</span>
                  <span style={{ fontSize: '1.4rem' }}>💰</span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706' }}>
                  ₹28–₹32<span style={{ fontSize: '1rem', fontWeight: 600 }}>/kg</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                  AI Suggested Fair Price: ₹29/kg
                </div>
              </div>

              <div className="card-clean">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#4b6357', fontWeight: 600 }}>{dict.pendingPayments}</span>
                  <span style={{ fontSize: '1.4rem' }}>🔒</span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7' }}>
                  ₹2,900
                </div>
                <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                  Escrow Locked (Release upon QR scan)
                </div>
              </div>
            </div>

            {/* Farmer Active Produce & Add Crop Form */}
            <div className="grid-2" style={{ marginBottom: '24px' }}>
              
              {/* My Produce Listings */}
              <div className="card-clean">
                <div className="card-header-bar">
                  <h3 className="card-title">
                    <Sprout size={20} color="#108e56" /> My Produce Listings
                  </h3>
                  <span className="badge badge-info">{produceList.length} Lots Listed</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {produceList.slice(0, 4).map((p) => (
                    <div key={p.id} style={{ padding: '14px', background: '#f8faf9', borderRadius: '12px', border: '1px solid #e2ece6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0a2f1d' }}>
                          {p.crop_name} ({p.quality_grade})
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#4b6357' }}>
                          Qty: <strong>{p.quantity_kg} kg</strong> • Location: {p.location}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#108e56', fontWeight: 600 }}>
                          Harvest Date: {p.harvest_date}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0a2f1d' }}>
                          ₹{p.expected_price_per_kg}/kg
                        </div>
                        <span className={`badge ${p.status === 'Aggregated' ? 'badge-info' : 'badge-success'}`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Produce Form with AI Assistant autofill hint */}
              <div className="card-clean" id="add-crop-section">
                <div className="card-header-bar">
                  <h3 className="card-title">
                    <Plus size={20} color="#108e56" /> Add Crop for Direct Sale
                  </h3>
                  <button 
                    onClick={() => setIsAssistantOpen(true)}
                    style={{ fontSize: '0.78rem', background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    🎙️ Auto-fill via Voice
                  </button>
                </div>

                <form onSubmit={handleAddProduce}>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Select Crop</label>
                      <select 
                        value={newProduceForm.crop_name}
                        onChange={(e) => setNewProduceForm({ ...newProduceForm, crop_name: e.target.value })}
                        className="form-select"
                      >
                        <option value="Tomato">Tomato (தக்காளி)</option>
                        <option value="Onion">Onion (வெங்காயம்)</option>
                        <option value="Potato">Potato (உருளைக்கிழங்கு)</option>
                        <option value="Paddy">Paddy (நெல்)</option>
                        <option value="Chili">Chili (மிளகாய்)</option>
                        <option value="Carrot">Carrot (கேரட்)</option>
                        <option value="Cabbage">Cabbage (முட்டைக்கோஸ்)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Available Quantity (kg)</label>
                      <input 
                        type="number"
                        value={newProduceForm.quantity_kg}
                        onChange={(e) => setNewProduceForm({ ...newProduceForm, quantity_kg: Number(e.target.value) })}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Quality Grade</label>
                      <select 
                        value={newProduceForm.quality_grade}
                        onChange={(e) => setNewProduceForm({ ...newProduceForm, quality_grade: e.target.value })}
                        className="form-select"
                      >
                        <option value="Grade A">Grade A (Supermarket/Bulk)</option>
                        <option value="Grade B">Grade B (Standard Commercial)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Expected Price (₹/kg)</label>
                      <input 
                        type="number"
                        value={newProduceForm.expected_price_per_kg}
                        onChange={(e) => setNewProduceForm({ ...newProduceForm, expected_price_per_kg: Number(e.target.value) })}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Farm Location</label>
                      <input 
                        type="text"
                        value={newProduceForm.location}
                        onChange={(e) => setNewProduceForm({ ...newProduceForm, location: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Harvest Date</label>
                      <input 
                        type="date"
                        value={newProduceForm.harvest_date}
                        onChange={(e) => setNewProduceForm({ ...newProduceForm, harvest_date: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-rural btn-rural-primary" style={{ width: '100%', minHeight: '48px' }}>
                    <Plus size={18} /> List Crop on AgriBridge Network
                  </button>
                </form>
              </div>

            </div>

            {/* Direct Link to Reverse Marketplace Buyer Demands */}
            <div className="card-clean">
              <div className="card-header-bar">
                <h3 className="card-title">
                  <ShoppingCart size={20} color="#0284c7" /> Immediate Buyer Demands Matching Your Produce
                </h3>
                <button 
                  onClick={() => setCurrentView('marketplace')}
                  style={{ background: 'none', border: 'none', color: '#108e56', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  View All {requirements.length} Requirements <ArrowRight size={14} />
                </button>
              </div>

              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Crop & Quality</th>
                      <th>Quantity Needed</th>
                      <th>Max Price</th>
                      <th>Buyer Location</th>
                      <th>Required Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.slice(0, 3).map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.crop_name}</strong> ({r.quality_grade})
                        </td>
                        <td>{r.required_quantity_kg} kg</td>
                        <td style={{ fontWeight: 700, color: '#059669' }}>₹{r.max_price_per_kg}/kg</td>
                        <td>{r.delivery_location}</td>
                        <td>{r.required_date}</td>
                        <td>
                          <button 
                            onClick={() => {
                              setSelectedRequirement(r);
                              setCurrentView('req_detail');
                            }}
                            className="btn-rural btn-rural-primary"
                            style={{ minHeight: '34px', padding: '4px 12px', fontSize: '0.82rem' }}
                          >
                            Respond to Requirement
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            VIEW 3: REVERSE MARKETPLACE (BUYER-FIRST INNOVATION)
            ========================================== */}
        {currentView === 'marketplace' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                  SIH Innovation #1: Buyer-Demand-First Model
                </span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0a2f1d' }}>
                  {dict.buyerFirstHeader}
                </h1>
                <p style={{ color: '#4b6357', fontSize: '1rem', maxWidth: '800px' }}>
                  {dict.buyerFirstSubtitle}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {currentRole === 'buyer' && (
                  <button 
                    onClick={() => {
                      const el = document.getElementById('post-requirement-box');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="btn-rural btn-rural-primary"
                  >
                    <Plus size={18} /> {dict.postRequirement}
                  </button>
                )}
                <button 
                  onClick={() => setCurrentView('vfpo')}
                  className="btn-rural btn-rural-gold"
                >
                  <Users size={18} /> {dict.createBulkSupply}
                </button>
              </div>
            </div>

            {/* List of Buyer Requirements */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '32px' }}>
              {requirements.map((req) => (
                <div key={req.id} className="card-clean" style={{ borderLeft: '6px solid #10b981' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '1.5rem' }}>🍅</span>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0a2f1d' }}>
                          {req.crop_name} ({req.quality_grade})
                        </h3>
                        <span className={`badge ${req.status === 'Open' ? 'badge-success' : 'badge-warning'}`}>
                          {req.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.92rem', color: '#4b6357', marginBottom: '8px' }}>
                        Posted by <strong>{req.buyer_name}</strong> • {req.buyer_company || 'Bulk Wholesale Partner'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', color: '#4b6357' }}>Max Budget Price:</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>
                        ₹{req.max_price_per_kg}<span style={{ fontSize: '1rem', fontWeight: 600 }}>/kg</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#108e56', fontWeight: 700 }}>
                        Total Value: ₹{(req.required_quantity_kg * req.max_price_per_kg).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid-3" style={{ background: '#f8faf9', padding: '14px', borderRadius: '12px', margin: '14px 0', border: '1px solid #e2ece6' }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: '#4b6357', textTransform: 'uppercase', fontWeight: 700 }}>Required Quantity:</span>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0a2f1d' }}>
                        {req.required_quantity_kg.toLocaleString()} kg
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: '#4b6357', textTransform: 'uppercase', fontWeight: 700 }}>Delivery Location:</span>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0a2f1d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} color="#059669" /> {req.delivery_location}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: '#4b6357', textTransform: 'uppercase', fontWeight: 700 }}>Required Delivery Date:</span>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0a2f1d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} color="#059669" /> {req.required_date}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar of Fulfillment via Virtual FPO */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: '#4b6357', marginBottom: '4px' }}>
                      <span>Aggregated Bulk Fulfillment: {req.fulfilled_quantity_kg} kg of {req.required_quantity_kg} kg</span>
                      <span>{Math.round((req.fulfilled_quantity_kg / req.required_quantity_kg) * 100)}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#e2ece6', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#10b981', width: `${Math.min(100, (req.fulfilled_quantity_kg / req.required_quantity_kg) * 100)}%` }}></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => {
                        setSelectedRequirement(req);
                        setCurrentView('req_detail');
                      }}
                      className="btn-rural btn-rural-primary"
                      style={{ minHeight: '42px', fontSize: '0.92rem' }}
                    >
                      {dict.respondRequirement}
                    </button>
                    <button 
                      onClick={() => setCurrentView('vfpo')}
                      className="btn-rural btn-rural-gold"
                      style={{ minHeight: '42px', fontSize: '0.92rem' }}
                    >
                      <Users size={16} /> {dict.createBulkSupply} (Virtual FPO)
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedRequirement(req);
                        setCurrentView('req_detail');
                      }}
                      className="btn-rural btn-rural-secondary"
                      style={{ minHeight: '42px', fontSize: '0.92rem' }}
                    >
                      <Eye size={16} /> {dict.viewDetails} ({req.response_count || 0} Offers)
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Post Buyer Requirement Form (for Buyer role) */}
            <div className="card-clean" id="post-requirement-box">
              <div className="card-header-bar">
                <h3 className="card-title">
                  <Plus size={20} color="#108e56" /> Post Enterprise Demand First (Buyer Interface)
                </h3>
                <span className="badge badge-info">Zero Intermediary Direct Sourcing</span>
              </div>

              <form onSubmit={handleCreateRequirement}>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Crop Required</label>
                    <select 
                      value={newReqForm.crop_name}
                      onChange={(e) => setNewReqForm({ ...newReqForm, crop_name: e.target.value })}
                      className="form-select"
                    >
                      <option value="Tomato">Tomato (தக்காளி)</option>
                      <option value="Onion">Onion (வெங்காயம்)</option>
                      <option value="Potato">Potato (உருளைக்கிழங்கு)</option>
                      <option value="Paddy">Paddy (நெல்)</option>
                      <option value="Chili">Chili (மிளகாய்)</option>
                      <option value="Carrot">Carrot (கேரட்)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total Required Quantity (kg)</label>
                    <input 
                      type="number"
                      value={newReqForm.required_quantity_kg}
                      onChange={(e) => setNewReqForm({ ...newReqForm, required_quantity_kg: Number(e.target.value) })}
                      className="form-input"
                      placeholder="e.g. 1000"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quality Specification</label>
                    <select 
                      value={newReqForm.quality_grade}
                      onChange={(e) => setNewReqForm({ ...newReqForm, quality_grade: e.target.value })}
                      className="form-select"
                    >
                      <option value="Grade A">Grade A (Certified Supermarket / Export)</option>
                      <option value="Grade B">Grade B (Standard Commercial Processing)</option>
                    </select>
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Max Budget Price (₹/kg)</label>
                    <input 
                      type="number"
                      value={newReqForm.max_price_per_kg}
                      onChange={(e) => setNewReqForm({ ...newReqForm, max_price_per_kg: Number(e.target.value) })}
                      className="form-input"
                      placeholder="e.g. 30"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Delivery Location</label>
                    <input 
                      type="text"
                      value={newReqForm.delivery_location}
                      onChange={(e) => setNewReqForm({ ...newReqForm, delivery_location: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Delivery Date</label>
                    <input 
                      type="date"
                      value={newReqForm.required_date}
                      onChange={(e) => setNewReqForm({ ...newReqForm, required_date: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-rural btn-rural-primary" style={{ width: '100%', minHeight: '48px' }}>
                  <Plus size={18} /> Publish Demand to All Farmers & Virtual FPOs
                </button>
              </form>
            </div>

          </div>
        )}

        {/* ==========================================
            VIEW 4: BUYER REQUIREMENT DETAILS & RESPOND
            ========================================== */}
        {currentView === 'req_detail' && selectedRequirement && (
          <div>
            <button 
              onClick={() => setCurrentView('marketplace')}
              style={{ background: 'none', border: 'none', color: '#108e56', fontWeight: 700, marginBottom: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              ← Back to Reverse Marketplace
            </button>

            <div className="card-clean" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <span className="badge badge-success" style={{ marginBottom: '6px' }}>Requirement ID: REQ-{selectedRequirement.id}</span>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0a2f1d' }}>
                    {selectedRequirement.crop_name} ({selectedRequirement.quality_grade})
                  </h1>
                  <p style={{ color: '#4b6357' }}>
                    Posted by <strong>{selectedRequirement.buyer_name}</strong> ({selectedRequirement.buyer_company || 'Enterprise Agro Buyer'})
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: '#4b6357' }}>Max Buying Price:</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>
                    ₹{selectedRequirement.max_price_per_kg}/kg
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#108e56', fontWeight: 700 }}>
                    Target Order: {selectedRequirement.required_quantity_kg} kg (₹{(selectedRequirement.required_quantity_kg * selectedRequirement.max_price_per_kg).toLocaleString()})
                  </div>
                </div>
              </div>

              {/* Aggregation Status */}
              <div style={{ background: '#f8faf9', padding: '16px', borderRadius: '12px', border: '1px solid #e2ece6', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 700, fontSize: '0.9rem' }}>
                  <span>Aggregated Through Virtual FPO:</span>
                  <span style={{ color: '#059669' }}>{selectedRequirement.fulfilled_quantity_kg} / {selectedRequirement.required_quantity_kg} kg ({Math.round((selectedRequirement.fulfilled_quantity_kg / selectedRequirement.required_quantity_kg) * 100)}%)</span>
                </div>
                <div style={{ height: '10px', background: '#e2ece6', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#10b981', width: `${Math.min(100, (selectedRequirement.fulfilled_quantity_kg / selectedRequirement.required_quantity_kg) * 100)}%` }}></div>
                </div>
              </div>

              {/* Respond to Requirement Form */}
              <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '14px', border: '1.5px solid #34d399' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#065f46', marginBottom: '14px' }}>
                  📝 Respond & Submit Bulk Supply Offer
                </h3>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Offered Quantity (kg)</label>
                    <input 
                      type="number"
                      value={respondForm.offered_quantity_kg}
                      onChange={(e) => setRespondForm({ ...respondForm, offered_quantity_kg: Number(e.target.value) })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Offered Price (₹/kg)</label>
                    <input 
                      type="number"
                      value={respondForm.offered_price_per_kg}
                      onChange={(e) => setRespondForm({ ...respondForm, offered_price_per_kg: Number(e.target.value) })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Delivery Date</label>
                    <input 
                      type="date"
                      value={respondForm.delivery_date}
                      onChange={(e) => setRespondForm({ ...respondForm, delivery_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => handleRespondRequirement(selectedRequirement.id)}
                    className="btn-rural btn-rural-primary"
                    style={{ minHeight: '44px', fontSize: '0.95rem' }}
                  >
                    Submit Offer Directly to Buyer
                  </button>
                  <button 
                    onClick={() => setCurrentView('vfpo')}
                    className="btn-rural btn-rural-gold"
                    style={{ minHeight: '44px', fontSize: '0.95rem' }}
                  >
                    Create Bulk Virtual FPO Pool
                  </button>
                </div>
              </div>

            </div>

            {/* Existing Responses Received Table */}
            <div className="card-clean">
              <h3 className="card-title" style={{ marginBottom: '16px' }}>
                Farmer & FPO Offers Received ({selectedRequirement.responses?.length || 0})
              </h3>
              {selectedRequirement.responses && selectedRequirement.responses.length > 0 ? (
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Respondent</th>
                        <th>Type</th>
                        <th>Offered Qty</th>
                        <th>Offered Price</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequirement.responses.map((resp) => (
                        <tr key={resp.id}>
                          <td><strong>{resp.respondent_name}</strong></td>
                          <td><span className="badge badge-info">{resp.respondent_type}</span></td>
                          <td>{resp.offered_quantity_kg} kg</td>
                          <td style={{ fontWeight: 700, color: '#059669' }}>₹{resp.offered_price_per_kg}/kg</td>
                          <td><span className="badge badge-success">{resp.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: '#4b6357' }}>
                  No standalone offers yet. This requirement is being fulfilled through the Virtual FPO pool below!
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==========================================
            VIEW 5: VIRTUAL FPO MODULE (CORE INNOVATION)
            ========================================== */}
        {currentView === 'vfpo' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                  SIH Innovation #3: Virtual FPO System
                </span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0a2f1d' }}>
                  {dict.vfpoHeader}
                </h1>
                <p style={{ color: '#4b6357', fontSize: '1rem', maxWidth: '820px' }}>
                  {dict.vfpoSubtitle}
                </p>
              </div>

              <button 
                onClick={() => setCurrentView('logistics')}
                className="btn-rural btn-rural-primary"
              >
                <Truck size={18} /> Schedule Smart Transport
              </button>
            </div>

            {/* Differentiating Feature Highlight Box */}
            <div style={{ background: 'linear-gradient(135deg, #0d381e 0%, #12472d 100%)', color: '#ffffff', borderRadius: '20px', padding: '28px', marginBottom: '28px', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#34d399', fontWeight: 800 }}>
                Example of Live Virtual FPO Dynamic Aggregation:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', margin: '16px 0', fontSize: '1.15rem', fontWeight: 700 }}>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '10px' }}>
                  Farmer A → 100 kg Tomato
                </span>
                <span>+</span>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '10px' }}>
                  Farmer B → 150 kg Tomato
                </span>
                <span>+</span>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '10px' }}>
                  Farmer C → 250 kg Tomato
                </span>
                <span>=</span>
                <span style={{ background: '#f59e0b', color: '#0f241a', padding: '8px 18px', borderRadius: '12px', fontWeight: 900, boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)' }}>
                  Virtual FPO → 500 kg Bulk Order
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', color: '#d1fae5' }}>
                All 3 farmers get the institutional buyer price of ₹29/kg with zero middlemen commissions deducted.
              </div>
            </div>

            {/* Active Virtual FPO Groups */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
              {vfpoGroups.map((g) => (
                <div key={g.id} className="card-clean" style={{ border: '2px solid #cbdcd3' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.6rem' }}>🍅</span>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0a2f1d' }}>
                          Pool {g.group_code}: {g.crop_name} ({g.quality_grade})
                        </h3>
                        <span className={`badge ${g.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                          {g.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#4b6357', marginTop: '4px' }}>
                        Lead: <strong>{g.fpo_lead_name}</strong> • Collection Hub: <strong>{g.collection_center}</strong>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 600 }}>
                        Committed Buyer: {g.buyer_name} ({g.delivery_location})
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', color: '#4b6357' }}>Target Bulk Quantity:</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0a2f1d' }}>
                        {g.current_quantity_kg} / {g.target_quantity_kg} kg
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#059669', fontWeight: 700 }}>
                        {g.percent_fulfilled}% Formed ({g.farmer_count} Farmers Participating)
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: '10px', background: '#e2ece6', borderRadius: '5px', overflow: 'hidden', marginBottom: '18px' }}>
                    <div style={{ height: '100%', background: '#10b981', width: `${Math.min(100, g.percent_fulfilled)}%` }}></div>
                  </div>

                  {/* Participating Farmers Breakdown Table (Prompt requirement #3) */}
                  <div style={{ background: '#f8faf9', borderRadius: '12px', border: '1px solid #e2ece6', padding: '14px', marginBottom: '16px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0a2f1d', marginBottom: '10px' }}>
                      Aggregated Produce Ledger (Individual Farmer Contributor Split):
                    </div>
                    <div className="data-table-wrapper">
                      <table className="data-table" style={{ background: '#ffffff' }}>
                        <thead>
                          <tr>
                            <th>Farmer Name</th>
                            <th>Crop</th>
                            <th>Quantity</th>
                            <th>Quality</th>
                            <th>Location</th>
                            <th>Harvest Date</th>
                            <th>Price / kg</th>
                            <th>Individual Payout</th>
                            <th>Payout Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.items && g.items.map((it) => (
                            <tr key={it.id}>
                              <td><strong>{it.farmer_name}</strong></td>
                              <td>{it.crop_name}</td>
                              <td><strong>{it.quantity_kg} kg</strong></td>
                              <td><span className="badge badge-success">{it.quality_grade}</span></td>
                              <td>{it.farmer_location}</td>
                              <td>{it.harvest_date}</td>
                              <td>₹{it.price_per_kg}/kg</td>
                              <td style={{ fontWeight: 800, color: '#059669' }}>₹{it.payout_amount.toLocaleString()}</td>
                              <td><span className="badge badge-info">{it.payout_status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => handleJoinVfpo(g.id)}
                      className="btn-rural btn-rural-primary"
                      style={{ minHeight: '42px', fontSize: '0.92rem' }}
                    >
                      <Plus size={16} /> Contribute 150 kg & Join this Pool
                    </button>
                    <button 
                      onClick={() => setCurrentView('logistics')}
                      className="btn-rural btn-rural-secondary"
                      style={{ minHeight: '42px', fontSize: '0.92rem' }}
                    >
                      <Truck size={16} /> Plan Route for this Pool
                    </button>
                    <button 
                      onClick={() => setIsQrModalOpen(true)}
                      className="btn-rural btn-rural-gold"
                      style={{ minHeight: '42px', fontSize: '0.92rem' }}
                    >
                      <QrCode size={16} /> Generate / View Batch QR
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ==========================================
            VIEW 6: AI DEMAND FORECASTING DASHBOARD
            ========================================== */}
        {currentView === 'forecast' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                  SIH Innovation #2: Predictive Intelligence
                </span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0a2f1d' }}>
                  {dict.demandForecast}
                </h1>
                <p style={{ color: '#4b6357', fontSize: '1rem' }}>
                  Trained with Scikit-learn, Pandas & historical agro-climatic mandi datasets.
                </p>
              </div>

              {/* Crop Selector Chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {forecasts.map((f) => (
                  <button
                    key={f.crop}
                    onClick={() => {
                      setSelectedForecastCrop(f.crop);
                      setSelectedForecast(f);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: selectedForecastCrop === f.crop ? '2px solid #10b981' : '1px solid #cbdcd3',
                      background: selectedForecastCrop === f.crop ? '#ecfdf5' : '#ffffff',
                      color: selectedForecastCrop === f.crop ? '#059669' : '#4b6357'
                    }}
                  >
                    {f.crop} ({f.tamil_name})
                  </button>
                ))}
              </div>
            </div>

            {selectedForecast && (
              <div>
                {/* 4 Cards as specified in Problem Statement */}
                <div className="grid-4" style={{ marginBottom: '24px' }}>
                  <div className="card-clean" style={{ borderTop: '4px solid #10b981' }}>
                    <span style={{ fontSize: '0.85rem', color: '#4b6357', fontWeight: 600 }}>Crop Analyzed</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0a2f1d', margin: '4px 0' }}>
                      {selectedForecast.crop}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#108e56', fontWeight: 600 }}>
                      {selectedForecast.tamil_name} ({selectedForecast.district})
                    </div>
                  </div>

                  <div className="card-clean" style={{ borderTop: '4px solid #059669' }}>
                    <span style={{ fontSize: '0.85rem', color: '#4b6357', fontWeight: 600 }}>Predicted Demand</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>
                      {selectedForecast.predicted_demand}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#4b6357', fontWeight: 600 }}>
                      Demand Score: {selectedForecast.demand_score}/100 • Confidence: {selectedForecast.confidence_percent}%
                    </div>
                  </div>

                  <div className="card-clean" style={{ borderTop: '4px solid #f59e0b' }}>
                    <span style={{ fontSize: '0.85rem', color: '#4b6357', fontWeight: 600 }}>Expected Market Price</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', margin: '4px 0' }}>
                      {selectedForecast.expected_price_range}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                      Baseline Average: ₹{selectedForecast.avg_price}/kg
                    </div>
                  </div>

                  <div className="card-clean" style={{ borderTop: '4px solid #0284c7' }}>
                    <span style={{ fontSize: '0.85rem', color: '#4b6357', fontWeight: 600 }}>Recommended Harvest Window</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', margin: '4px 0' }}>
                      {selectedForecast.recommended_harvest_window}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#0a2f1d', fontWeight: 600 }}>
                      Demand Trend: <strong>{selectedForecast.demand_trend}</strong>
                    </div>
                  </div>
                </div>

                {/* 6-Week Forecast Curve Visualization */}
                <div className="card-clean" style={{ marginBottom: '24px' }}>
                  <div className="card-header-bar">
                    <h3 className="card-title">
                      <TrendingUp size={20} color="#108e56" /> 6-Week Predictive Price & Demand Curve ({selectedForecast.crop})
                    </h3>
                    <span className="badge badge-success">ML Model: RandomForestRegressor</span>
                  </div>

                  <div style={{ background: '#f8faf9', padding: '20px', borderRadius: '14px', border: '1px solid #e2ece6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '220px', gap: '12px', padding: '0 10px' }}>
                      {selectedForecast.projection_chart?.labels.map((wk, i) => {
                        const price = selectedForecast.projection_chart.prices[i];
                        const demand = selectedForecast.projection_chart.demand[i];
                        const heightPx = Math.max(40, (price / 40) * 180);

                        return (
                          <div key={wk} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>
                              ₹{price}/kg
                            </div>
                            <div style={{
                              width: '100%',
                              maxWidth: '52px',
                              height: `${heightPx}px`,
                              background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                              borderRadius: '8px 8px 0 0',
                              position: 'relative',
                              transition: 'height 0.4s ease'
                            }}>
                              <div style={{ position: 'absolute', bottom: '6px', left: 0, right: 0, textAlign: 'center', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800 }}>
                                {demand}%
                              </div>
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#4b6357', fontWeight: 600, marginTop: '8px' }}>
                              {wk}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary & Market Drivers */}
                  <div style={{ marginTop: '18px', padding: '16px', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #34d399' }}>
                    <div style={{ fontWeight: 800, color: '#065f46', fontSize: '0.98rem', marginBottom: '6px' }}>
                      💡 Agro-Climatic Intelligence Insights:
                    </div>
                    <p style={{ fontSize: '0.92rem', color: '#0a2f1d', lineHeight: 1.5, marginBottom: '10px' }}>
                      {lang === 'ta' ? selectedForecast.recommendation_summary_tamil : selectedForecast.recommendation_summary}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedForecast.drivers?.map((d, idx) => (
                        <span key={idx} className="badge badge-info" style={{ fontSize: '0.78rem' }}>
                          ✓ {d}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* ==========================================
            VIEW 7: FAIR PRICE CALCULATOR
            ========================================== */}
        {currentView === 'fair_price' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                  SIH Innovation #6: Transparent Price Setting
                </span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0a2f1d' }}>
                  {dict.fairPriceHeader}
                </h1>
                <p style={{ color: '#4b6357', fontSize: '1rem', maxWidth: '800px' }}>
                  {dict.fairPriceFormula}
                </p>
              </div>

              <button 
                onClick={() => setCurrentView('marketplace')}
                className="btn-rural btn-rural-primary"
              >
                Match with Buyers at this Price →
              </button>
            </div>

            {/* Formula Interactive Banner */}
            <div style={{ background: 'linear-gradient(135deg, #0a2f1d 0%, #12472d 100%)', color: '#ffffff', padding: '24px', borderRadius: '18px', marginBottom: '24px', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#34d399', fontWeight: 800 }}>
                Live Transparent Price Determination Breakdown:
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '10px 0', color: '#fef3c7' }}>
                {calcResult?.formula_display || "₹18 (Production) + ₹4 (Demand) + ₹3 (Quality) + ₹4 (Logistics) = ₹29/kg"}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#d1fae5' }}>
                Both farmers and buyers understand exactly how every rupee is justified, preventing middlemen margin exploitation.
              </div>
            </div>

            {/* Inputs & Calculation Grid */}
            <div className="grid-2" style={{ marginBottom: '24px' }}>
              
              {/* Sliders and Selectors */}
              <div className="card-clean">
                <h3 className="card-title" style={{ marginBottom: '18px' }}>
                  Adjust Agricultural Cost Parameters
                </h3>

                <div className="form-group">
                  <label className="form-label">Select Crop</label>
                  <select 
                    value={calcCrop}
                    onChange={(e) => {
                      setCalcCrop(e.target.value);
                      calculateFairPrice(e.target.value, calcQty, calcCost, calcGrade, calcDemand, calcDist);
                    }}
                    className="form-select"
                  >
                    <option value="Tomato">Tomato (தக்காளி)</option>
                    <option value="Onion">Onion (வெங்காயம்)</option>
                    <option value="Potato">Potato (உருளைக்கிழங்கு)</option>
                    <option value="Paddy">Paddy (நெல்)</option>
                    <option value="Chili">Chili (மிளகாய்)</option>
                    <option value="Carrot">Carrot (கேரட்)</option>
                  </select>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="form-label">Base Production Cost (₹/kg)</label>
                    <span style={{ fontWeight: 800, color: '#0a2f1d' }}>₹{calcCost}/kg</span>
                  </div>
                  <input 
                    type="range"
                    min="10"
                    max="60"
                    value={calcCost}
                    onChange={(e) => {
                      setCalcCost(Number(e.target.value));
                      calculateFairPrice(calcCrop, calcQty, Number(e.target.value), calcGrade, calcDemand, calcDist);
                    }}
                    style={{ width: '100%', accentColor: '#10b981' }}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#4b6357' }}>Covers seeds, biological fertilizer, drip maintenance, and harvesting labor.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Crop Quality Grade</label>
                  <select 
                    value={calcGrade}
                    onChange={(e) => {
                      setCalcGrade(e.target.value);
                      calculateFairPrice(calcCrop, calcQty, calcCost, e.target.value, calcDemand, calcDist);
                    }}
                    className="form-select"
                  >
                    <option value="Grade A">Grade A (+15% Premium: Firm, Certified, Uniform)</option>
                    <option value="Grade B">Grade B (+5%: Commercial Grade Standard)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Market Demand Intensity</label>
                  <select 
                    value={calcDemand}
                    onChange={(e) => {
                      setCalcDemand(e.target.value);
                      calculateFairPrice(calcCrop, calcQty, calcCost, calcGrade, e.target.value, calcDist);
                    }}
                    className="form-select"
                  >
                    <option value="High">High Demand (+20% Upside Margin)</option>
                    <option value="Moderate">Moderate Demand (+10% Normal Margin)</option>
                    <option value="Low">Low Demand (+4% Base Floor Margin)</option>
                  </select>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="form-label">Transit Distance to Hub/Buyer (km)</label>
                    <span style={{ fontWeight: 800, color: '#0a2f1d' }}>{calcDist} km</span>
                  </div>
                  <input 
                    type="range"
                    min="5"
                    max="150"
                    value={calcDist}
                    onChange={(e) => {
                      setCalcDist(Number(e.target.value));
                      calculateFairPrice(calcCrop, calcQty, calcCost, calcGrade, calcDemand, Number(e.target.value));
                    }}
                    style={{ width: '100%', accentColor: '#10b981' }}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#4b6357' }}>Shared Virtual FPO logistics reduces cost to ~₹1.80/kg.</span>
                </div>
              </div>

              {/* Output Result Card */}
              {calcResult && (
                <div className="card-clean" style={{ background: '#ffffff', border: '2px solid #10b981' }}>
                  <div className="card-header-bar">
                    <h3 className="card-title">
                      <Award size={20} color="#059669" /> Calculated Fair Price Breakdown
                    </h3>
                    <span className="badge badge-success">35% Net Profit Target</span>
                  </div>

                  <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid #e2ece6', marginBottom: '18px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#4b6357', textTransform: 'uppercase', fontWeight: 700 }}>
                      Suggested Fair Price per Kilogram
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: '#0a2f1d' }}>
                      ₹{calcResult.breakdown.suggested_fair_price}
                      <span style={{ fontSize: '1.2rem', color: '#4b6357', fontWeight: 600 }}>/kg</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#059669', fontWeight: 700 }}>
                      Total Batch Value ({calcQty} kg): ₹{calcResult.total_batch_value.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.92rem', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #e2ece6' }}>
                      <span>Production Cost:</span>
                      <strong style={{ color: '#0a2f1d' }}>₹{calcResult.breakdown.production_cost} / kg</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #e2ece6' }}>
                      <span>+ Demand Adjustment:</span>
                      <strong style={{ color: '#059669' }}>+₹{calcResult.breakdown.demand_adjustment} / kg</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #e2ece6' }}>
                      <span>+ Quality Adjustment ({calcGrade}):</span>
                      <strong style={{ color: '#059669' }}>+₹{calcResult.breakdown.quality_adjustment} / kg</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #e2ece6' }}>
                      <span>+ Optimized Shared Logistics:</span>
                      <strong style={{ color: '#0284c7' }}>+₹{calcResult.breakdown.logistics_cost} / kg</strong>
                    </div>
                  </div>

                  <div style={{ background: '#f8faf9', padding: '14px', borderRadius: '10px', border: '1px solid #cbdcd3', fontSize: '0.86rem' }}>
                    <div style={{ fontWeight: 800, color: '#0a2f1d', marginBottom: '4px' }}>
                      {dict.whyPrice}
                    </div>
                    <p style={{ color: '#4b6357', lineHeight: 1.4 }}>
                      {calcResult.explanation.summary}
                    </p>
                    <div style={{ marginTop: '8px', color: '#108e56', fontWeight: 600 }}>
                      {calcResult.explanation.logistics_note}
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ==========================================
            VIEW 8: SMART LOGISTICS (OR-TOOLS + GIS MAP)
            ========================================== */}
        {currentView === 'logistics' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                  SIH Innovation #4: Smart Route Optimization
                </span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0a2f1d' }}>
                  {dict.logisticsHeader}
                </h1>
                <p style={{ color: '#4b6357', fontSize: '1rem', maxWidth: '820px' }}>
                  {dict.logisticsSubtitle}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setIsQrModalOpen(true)}
                  className="btn-rural btn-rural-gold"
                >
                  <QrCode size={18} /> View Batch QR
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid-4" style={{ marginBottom: '24px' }}>
              <div className="card-clean">
                <span style={{ fontSize: '0.85rem', color: '#4b6357', fontWeight: 600 }}>{dict.routeDistance}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0a2f1d', margin: '4px 0' }}>
                  58.4 <span style={{ fontSize: '1rem', fontWeight: 600 }}>km</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                  vs 194 km if farmers traveled individually
                </div>
              </div>

              <div className="card-clean">
                <span style={{ fontSize: '0.85rem', color: '#4b6357', fontWeight: 600 }}>{dict.costSavings}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>
                  ₹4,130 (74%)
                </div>
                <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                  Aggregated route: ₹1,420 vs ₹5,550
                </div>
              </div>

              <div className="card-clean">
                <span style={{ fontSize: '0.85rem', color: '#4b6357', fontWeight: 600 }}>{dict.spoilageRisk}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>
                  5.2% <span style={{ fontSize: '0.9rem', color: '#059669' }}>(Low)</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#4b6357', fontWeight: 600 }}>
                  Insulated pre-cooling maintains &lt; 26°C
                </div>
              </div>

              <div className="card-clean">
                <span style={{ fontSize: '0.85rem', color: '#4b6357', fontWeight: 600 }}>{dict.transitHours}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', margin: '4px 0' }}>
                  2.4 <span style={{ fontSize: '1rem', fontWeight: 600 }}>Hours</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                  3 Pickups + Pre-cooling Hub
                </div>
              </div>
            </div>

            {/* Interactive SVG GIS Map Component */}
            <div style={{ marginBottom: '24px' }}>
              <SmartRouteMap />
            </div>

            {/* Logistics Waypoints Schedule */}
            <div className="card-clean">
              <h3 className="card-title" style={{ marginBottom: '16px' }}>
                Multi-Stop Vehicle Waypoint Sequence (Farmer locations → Collection Point → Buyer)
              </h3>
              
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Stop #</th>
                      <th>Role & Location</th>
                      <th>Cargo Action</th>
                      <th>Quantity</th>
                      <th>Expected Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>1</strong></td>
                      <td>Farmer A (Kinathukadavu)</td>
                      <td>Collect Grade A Tomato from Muthuvel farm gate</td>
                      <td>100 kg</td>
                      <td>07:30 AM</td>
                      <td><span className="badge badge-success">✓ Picked Up</span></td>
                    </tr>
                    <tr>
                      <td><strong>2</strong></td>
                      <td>Farmer B (Negamam)</td>
                      <td>Collect Grade A Tomato from Ramasamy farm gate</td>
                      <td>150 kg</td>
                      <td>08:15 AM</td>
                      <td><span className="badge badge-success">✓ Picked Up</span></td>
                    </tr>
                    <tr>
                      <td><strong>3</strong></td>
                      <td>Farmer C (Sulur)</td>
                      <td>Collect Grade A Tomato from Palanisamy farm gate</td>
                      <td>250 kg</td>
                      <td>09:00 AM</td>
                      <td><span className="badge badge-success">✓ Picked Up</span></td>
                    </tr>
                    <tr>
                      <td><strong>4</strong></td>
                      <td>Pollachi Virtual FPO Hub</td>
                      <td>Pre-cooling consolidation & batch QR tag attachment</td>
                      <td>500 kg</td>
                      <td>09:45 AM</td>
                      <td><span className="badge badge-success">✓ Certified</span></td>
                    </tr>
                    <tr>
                      <td><strong>5</strong></td>
                      <td>Coimbatore Agro Fresh Wholesale</td>
                      <td>Final destination unloading, QR verification & Escrow release</td>
                      <td>500 kg</td>
                      <td>10:45 AM</td>
                      <td><span className="badge badge-warning">🚛 In Transit</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            VIEW 9: QR TRACEABILITY PAGE
            ========================================== */}
        {currentView === 'qr' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                  SIH Innovation #5: Farm-to-Fork Traceability
                </span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0a2f1d' }}>
                  {dict.qrHeader}
                </h1>
                <p style={{ color: '#4b6357', fontSize: '1rem', maxWidth: '800px' }}>
                  {dict.qrSubtitle}
                </p>
              </div>

              <button 
                onClick={() => setIsQrModalOpen(true)}
                className="btn-rural btn-rural-primary"
              >
                <QrCode size={18} /> Open Interactive QR Scanner & Generator
              </button>
            </div>

            {/* List of Active QR Batches */}
            <div className="grid-2">
              {qrBatches.map((b) => (
                <div key={b.id} className="card-clean" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span className="badge badge-info" style={{ fontWeight: 800 }}>{b.batch_id}</span>
                      <span className={`badge ${b.verification_status === 'Verified & Accepted' ? 'badge-success' : 'badge-warning'}`}>
                        {b.verification_status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                      {b.qr_code_base64 && (
                        <img 
                          src={b.qr_code_base64} 
                          alt="QR" 
                          style={{ width: '110px', height: '110px', borderRadius: '10px', border: '1px solid #cbdcd3' }} 
                        />
                      )}
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0a2f1d' }}>
                          {b.crop_name} ({b.total_quantity_kg} kg)
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>
                          Grade: {b.quality_grade} Certified
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#4b6357', marginTop: '4px' }}>
                          Origin: <strong>{b.origin_district}</strong> • Harvest: {b.harvest_date}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 600 }}>
                          Buyer: {b.buyer_name}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#f8faf9', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2ece6', fontSize: '0.8rem', color: '#4b6357', marginBottom: '16px' }}>
                      <strong>Farmers:</strong> {b.farmer_names}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => {
                        setSelectedBatch(b);
                        setIsQrModalOpen(true);
                      }}
                      className="btn-rural btn-rural-primary"
                      style={{ flex: 1, minHeight: '40px', fontSize: '0.88rem' }}
                    >
                      <QrCode size={16} /> Scan / Inspect Batch
                    </button>
                    <button 
                      onClick={() => setCurrentView('payments')}
                      className="btn-rural btn-rural-secondary"
                      style={{ minHeight: '40px', fontSize: '0.88rem' }}
                    >
                      View Escrow
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ==========================================
            VIEW 10: SECURE ESCROW PAYMENTS WORKFLOW
            ========================================== */}
        {currentView === 'payments' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                  SIH Workflow: 5-Stage Escrow Protection
                </span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0a2f1d' }}>
                  {dict.paymentHeader}
                </h1>
                <p style={{ color: '#4b6357', fontSize: '1rem', maxWidth: '820px' }}>
                  {dict.paymentSubtitle}
                </p>
              </div>

              <button 
                onClick={() => handleAdvancePayment(payments[0]?.id || 1)}
                className="btn-rural btn-rural-gold"
              >
                <CreditCard size={18} /> {dict.advanceEscrow}
              </button>
            </div>

            {/* Active Escrow Item */}
            {payments.map((p) => {
              const currentStage = p.stage || 3;
              const stages = [
                { num: 1, name: "Buyer Places Order", desc: "Order committed" },
                { num: 2, name: "Payment Initiated", desc: "Funds in Escrow" },
                { num: 3, name: "Produce Supplied", desc: "In Transit" },
                { num: 4, name: "Produce Verified", desc: "QR Scan Passed" },
                { num: 5, name: "Payment Released", desc: "Disbursed to Farmers" },
              ];

              return (
                <div key={p.id} className="card-clean" style={{ marginBottom: '28px', border: '2px solid #cbdcd3' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <span className="badge badge-info" style={{ fontWeight: 800 }}>Ref: {p.payment_ref}</span>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0a2f1d', marginTop: '6px' }}>
                        Escrow Amount: ₹{p.total_amount.toLocaleString()}
                      </h3>
                      <div style={{ fontSize: '0.9rem', color: '#4b6357' }}>
                        Batch: <strong>{p.batch_id}</strong> • Buyer: <strong>{p.buyer_name}</strong>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                        Custody Account: {p.escrow_account} (State Bank of India Sandbox)
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', color: '#4b6357' }}>Current Escrow State:</div>
                      <span className={`badge ${currentStage === 5 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '1.05rem', padding: '6px 14px', marginTop: '4px' }}>
                        {p.status} (Stage {currentStage}/5)
                      </span>
                    </div>
                  </div>

                  {/* 5-Stage Visual Stepper */}
                  <div className="stepper-container" style={{ margin: '36px 0 20px' }}>
                    <div className="stepper-progress-bar">
                      <div 
                        className="stepper-progress-fill"
                        style={{ width: `${((currentStage - 1) / 4) * 100}%` }}
                      ></div>
                    </div>

                    {stages.map((st) => (
                      <div 
                        key={st.num}
                        className={`stepper-step ${st.num <= currentStage ? (st.num < currentStage ? 'completed' : 'active') : ''}`}
                      >
                        <div className="step-circle">
                          {st.num < currentStage ? '✓' : st.num}
                        </div>
                        <div className="step-label">{st.name}</div>
                        <div className="step-sublabel">{st.desc}</div>
                      </div>
                    ))}
                  </div>

                  {/* Individual Farmer DBT Splits Table */}
                  <div style={{ background: '#f8faf9', padding: '16px', borderRadius: '12px', border: '1px solid #e2ece6', marginTop: '20px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0a2f1d', marginBottom: '10px' }}>
                      Farmer Direct Benefit Transfer (DBT) Automated Allocation Table:
                    </div>
                    <div className="data-table-wrapper">
                      <table className="data-table" style={{ background: '#ffffff' }}>
                        <thead>
                          <tr>
                            <th>Farmer Recipient</th>
                            <th>Volume Share</th>
                            <th>Share %</th>
                            <th>Payout Amount</th>
                            <th>Destination Bank</th>
                            <th>Transfer Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.farmer_splits && p.farmer_splits.map((s, idx) => (
                            <tr key={idx}>
                              <td><strong>{s.farmer_name}</strong></td>
                              <td>{s.quantity_kg} kg</td>
                              <td>{s.share_percent}%</td>
                              <td style={{ fontWeight: 800, color: '#059669', fontSize: '1rem' }}>
                                ₹{s.payout_amount?.toLocaleString()}
                              </td>
                              <td>{s.bank || 'SBI-***714'}</td>
                              <td>
                                <span className={`badge ${currentStage === 5 ? 'badge-success' : 'badge-info'}`}>
                                  {currentStage === 5 ? '✓ Transferred (DBT Released)' : s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {currentStage < 5 ? (
                      <button 
                        onClick={() => handleAdvancePayment(p.id)}
                        className="btn-rural btn-rural-primary"
                        style={{ minHeight: '44px', fontSize: '0.95rem' }}
                      >
                        Advance to Stage {currentStage + 1} →
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 800 }}>
                        <CheckCircle2 size={20} /> All Farmers Paid Successfully! (Milestone 5 Completed)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        )}

        {/* ==========================================
            VIEW 11: NOTIFICATIONS VIEW
            ========================================== */}
        {currentView === 'notifications' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0a2f1d', marginBottom: '20px' }}>
              🔔 Notifications & Rural Alerts
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map((n) => (
                <div key={n.id} className="card-clean" style={{ padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.5rem', background: '#ecfdf5', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    📢
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0a2f1d' }}>
                      {lang === 'ta' && n.title_tamil ? n.title_tamil : n.title}
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#4b6357', marginTop: '4px', lineHeight: 1.4 }}>
                      {lang === 'ta' && n.message_tamil ? n.message_tamil : n.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#88a896', marginTop: '6px' }}>
                      Role: {n.role || 'All users'} • {n.created_at || 'Just now'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            VIEW 12: FPO / BUYER / ADMIN SPECIFIC VIEWS
            ========================================== */}
        {currentView === 'fpo_dash' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                🏢 Virtual FPO Dashboard: Kongu Virtual FPO Co-op
              </span>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0a2f1d' }}>
                Virtual FPO Operations Center
              </h1>
              <p style={{ color: '#4b6357' }}>
                Manage participating farmers, cluster crop lots, and dispatch optimized consignments.
              </p>
            </div>

            <div className="grid-3" style={{ marginBottom: '24px' }}>
              <div className="card-clean">
                <span style={{ fontSize: '0.85rem', color: '#4b6357' }}>Active Member Farmers</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0a2f1d' }}>42 Farmers</div>
                <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>Kinathukadavu, Negamam, Sulur clusters</div>
              </div>
              <div className="card-clean">
                <span style={{ fontSize: '0.85rem', color: '#4b6357' }}>Aggregated Produce This Week</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>3,500 kg</div>
                <div style={{ fontSize: '0.8rem', color: '#4b6357' }}>Tomato, Onion, Potato</div>
              </div>
              <div className="card-clean">
                <span style={{ fontSize: '0.85rem', color: '#4b6357' }}>Total Farmer Earnings Disbursed</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706' }}>₹1,01,500</div>
                <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>Zero middleman deductions</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
              <button onClick={() => setCurrentView('vfpo')} className="btn-rural btn-rural-primary">
                <Users size={18} /> Manage Bulk Pools
              </button>
              <button onClick={() => setCurrentView('logistics')} className="btn-rural btn-rural-secondary">
                <Truck size={18} /> Route Planning
              </button>
              <button onClick={() => setIsQrModalOpen(true)} className="btn-rural btn-rural-gold">
                <QrCode size={18} /> Batch QR Management
              </button>
            </div>
          </div>
        )}

        {currentView === 'buyer_dash' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <span className="badge badge-info" style={{ marginBottom: '6px' }}>
                🛒 Buyer Dashboard: Coimbatore Agro Fresh Wholesale
              </span>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0a2f1d' }}>
                Enterprise Sourcing Portal
              </h1>
              <p style={{ color: '#4b6357' }}>
                Post crop demand, compare direct farmer/FPO offers, track arrivals, and release escrow payouts.
              </p>
            </div>

            <div className="grid-3" style={{ marginBottom: '24px' }}>
              <div className="card-clean">
                <span style={{ fontSize: '0.85rem', color: '#4b6357' }}>Active Requirements</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0a2f1d' }}>3 Posts</div>
                <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>1000kg Tomato, 1500kg Onion, 2000kg Potato</div>
              </div>
              <div className="card-clean">
                <span style={{ fontSize: '0.85rem', color: '#4b6357' }}>Protected Escrow Balance</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0284c7' }}>₹14,500</div>
                <div style={{ fontSize: '0.8rem', color: '#4b6357' }}>Held safely until produce verified</div>
              </div>
              <div className="card-clean">
                <span style={{ fontSize: '0.85rem', color: '#4b6357' }}>Quality Assurance</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>100% Grade A</div>
                <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>QR Tracked with farm provenance</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
              <button onClick={() => setCurrentView('marketplace')} className="btn-rural btn-rural-primary">
                <Plus size={18} /> Post New Crop Requirement
              </button>
              <button onClick={() => setIsQrModalOpen(true)} className="btn-rural btn-rural-gold">
                <QrCode size={18} /> Scan Arrival Batch QR
              </button>
              <button onClick={() => setCurrentView('payments')} className="btn-rural btn-rural-secondary">
                <CreditCard size={18} /> Monitor Escrow Payouts
              </button>
            </div>
          </div>
        )}

        {currentView === 'admin_dash' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <span className="badge badge-warning" style={{ marginBottom: '6px' }}>
                🛡️ AgriBridge National Administration Portal
              </span>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0a2f1d' }}>
                System Oversight & Governance
              </h1>
              <p style={{ color: '#4b6357' }}>
                Monitor fair pricing compliance, farmer registrations, virtual FPO aggregations, and escrow transactions.
              </p>
            </div>

            <div className="grid-4" style={{ marginBottom: '24px' }}>
              <div className="card-clean">
                <span style={{ fontSize: '0.85rem', color: '#4b6357' }}>Registered Farmers</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0a2f1d' }}>1,280</div>
                <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>Aadhaar & DBT Verified</div>
              </div>
              <div className="card-clean">
                <span style={{ fontSize: '0.85rem', color: '#4b6357' }}>Active Virtual FPOs</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>28 Pools</div>
                <div style={{ fontSize: '0.78rem', color: '#4b6357' }}>Across 6 Tamil Nadu Districts</div>
              </div>
              <div className="card-clean">
                <span style={{ fontSize: '0.85rem', color: '#4b6357' }}>Total Platform Volume</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706' }}>₹24.8 Lakhs</div>
                <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>Eliminated ~₹6.2L in middlemen commissions</div>
              </div>
              <div className="card-clean">
                <span style={{ fontSize: '0.85rem', color: '#4b6357' }}>Logistics Spoilage Saved</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7' }}>18.4 Tons</div>
                <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>Through cold-chain route solver</div>
              </div>
            </div>

            <div className="card-clean">
              <h3 className="card-title" style={{ marginBottom: '14px' }}>
                Platform Control Actions
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button 
                  onClick={async () => {
                    await fetch('/api/demo/reset', { method: 'POST' });
                    alert("Demo data reset to clean initial state!");
                    fetchAllData();
                  }}
                  className="btn-rural btn-rural-secondary"
                >
                  <RefreshCw size={16} /> Reset Demo Dataset
                </button>
                <button 
                  onClick={() => setIsDemoFlowOpen(true)}
                  className="btn-rural btn-rural-primary"
                >
                  <Play size={16} /> Run End-to-End SIH Presentation Flow
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 4. MODALS & POPUPS */}
      <QRTraceabilityModal 
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        batchData={selectedBatch || qrBatches[0]}
        onVerifySuccess={(batchId) => {
          fetchAllData();
        }}
      />

      <SIHDemoFlowModal 
        isOpen={isDemoFlowOpen}
        onClose={() => setIsDemoFlowOpen(false)}
        onNavigateView={(view) => {
          setCurrentView(view);
          if (view === 'farmer_dash') setCurrentRole('farmer');
          if (view === 'vfpo') setCurrentRole('fpo');
          if (view === 'marketplace') setCurrentRole('buyer');
        }}
      />

      {/* 5. FLOATING AI ASSISTANT WIDGET (CAN BE TOGGLED ANYWHERE) */}
      {isAssistantOpen && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', width: '380px', maxWidth: 'calc(100vw - 32px)', zIndex: 1100 }}>
          <AIAssistantWidget 
            language={lang}
            onAutoFillForm={handleAssistantAutoFill}
            onClose={() => setIsAssistantOpen(false)}
          />
        </div>
      )}

      {/* 6. COMPREHENSIVE FOOTER */}
      <footer className="app-footer">
        <div className="footer-content">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
              🌾 AgriBridge AI
            </div>
            <div style={{ fontSize: '0.85rem', color: '#a3c2b2', marginTop: '4px' }}>
              Virtual FPO + AI Supply Chain Platform (SIH26033)
            </div>
            <div style={{ fontSize: '0.78rem', color: '#799d8b', marginTop: '2px' }}>
              Eliminating agricultural intermediaries • Transparent pricing • PostGIS & GIS routing
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => setCurrentView('landing')} style={{ background: 'none', border: 'none', color: '#d1fae5', cursor: 'pointer' }}>Home</button>
            <button onClick={() => setCurrentView('marketplace')} style={{ background: 'none', border: 'none', color: '#d1fae5', cursor: 'pointer' }}>Reverse Marketplace</button>
            <button onClick={() => setCurrentView('vfpo')} style={{ background: 'none', border: 'none', color: '#d1fae5', cursor: 'pointer' }}>Virtual FPO</button>
            <button onClick={() => setCurrentView('forecast')} style={{ background: 'none', border: 'none', color: '#d1fae5', cursor: 'pointer' }}>AI Demand</button>
            <button onClick={() => setCurrentView('fair_price')} style={{ background: 'none', border: 'none', color: '#d1fae5', cursor: 'pointer' }}>Fair Price</button>
            <button onClick={() => setIsDemoFlowOpen(true)} style={{ background: 'none', border: 'none', color: '#f59e0b', fontWeight: 700, cursor: 'pointer' }}>SIH Walkthrough</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
