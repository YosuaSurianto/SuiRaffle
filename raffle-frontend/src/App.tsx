import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useState } from 'react';

const PACKAGE_ID = '0x1a5d0c5d5b4c9f75f032071ee7f29216b665b3bb9200eb254c5777982b2b6d8a'; 
const TEST_POOL_ID = '0x8eec84467d3c77e8e795fc1d20a1876f3501564b693121cd932e836cacdf47f6';


const MODULE = 'game';
const CLOCK_ID = '0x6';
const RANDOM_ID = '0x8';
const THEME_COLOR = '#00e5ff'; 

function App() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [loading, setLoading] = useState(false);
  const [targetPool, setTargetPool] = useState(TEST_POOL_ID);
  
  // State untuk Link Hasil Transaksi
  const [successLink, setSuccessLink] = useState("");

  // State Input Dashboard
  const [priceInput, setPriceInput] = useState("1");
  const [slotInput, setSlotInput] = useState("5");
  const [winnerInput, setWinnerInput] = useState("2"); 
  const [durationInput, setDurationInput] = useState("24");

  // --- FUNGSI CREATE POOL ---
  const createPool = () => {
    if (!account) return;
    setLoading(true);
    setSuccessLink(""); // Reset link lama
    
    const tx = new Transaction();
    const priceInMist = parseFloat(priceInput) * 1_000_000_000;
    
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE}::create_pool`,
      arguments: [
        tx.pure.u64(priceInMist), 
        tx.pure.u64(Number(slotInput)), 
        tx.pure.u64(Number(winnerInput)),
        tx.pure.u64(Number(durationInput)), 
        tx.object(CLOCK_ID)
      ],
    });

    signAndExecute({ transaction: tx }, {
      onSuccess: (result) => {
        const digest = result.digest;
        const link = `https://suiscan.xyz/testnet/tx/${digest}`;
        
        // Simpan link ke State biar muncul di layar
        setSuccessLink(link);
        
        alert('✅ POOL BERHASIL! Silakan klik tombol "LIHAT TIKET" yang baru muncul.');
        setLoading(false); 
      },
      onError: (e) => { 
        alert('❌ ERROR: ' + e.message); 
        setLoading(false); 
      }
    });
  };

  // --- FUNGSI JOIN POOL ---
  const joinPool = () => {
    if (!account) return;
    setLoading(true);
    const tx = new Transaction();
    const TICKET_PRICE = 1_000_000_000; 
    const [coin] = tx.splitCoins(tx.gas, [TICKET_PRICE]);

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE}::buy_ticket`,
      arguments: [tx.object(targetPool), coin, tx.object(RANDOM_ID), tx.object(CLOCK_ID)],
    });

    signAndExecute({ transaction: tx }, {
      onSuccess: () => { alert('🎟️ TIKET DIBELI! Menunggu slot penuh...'); setLoading(false); },
      onError: (e) => { alert('❌ ERROR: ' + e.message); setLoading(false); }
    });
  };

  // Styles
  const inputStyle = {
    width: '100%', padding: '12px', background: 'rgba(0, 229, 255, 0.05)', 
    border: `1px solid ${THEME_COLOR}44`, color: 'white', borderRadius: '5px', outline: 'none',
    marginBottom: '10px'
  };
  const labelStyle = { display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '0.8rem', textTransform: 'uppercase' as const, letterSpacing: '1px' };

  // 1. LANDING PAGE
  if (!account) {
    return (
      <div style={{
        background: 'radial-gradient(circle at 50% 50%, #050510 0%, #000 100%)',
        minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: 'Courier New, monospace'
      }}>
        <div style={{
          border: `2px solid ${THEME_COLOR}`, padding: '40px', borderRadius: '20px', 
          boxShadow: `0 0 50px ${THEME_COLOR}33`, backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.5)'
        }}>
          <h1 style={{fontSize: '3.5rem', margin: '0 0 10px 0', textShadow: `0 0 20px ${THEME_COLOR}`, color: 'white'}}>
            SUI RAFFLE <span style={{color: THEME_COLOR}}>PROTOCOL</span>
          </h1>
          <p style={{fontSize: '1.2rem', color: '#8892b0', marginBottom: '40px', letterSpacing: '2px'}}>
            FAIR LAUNCH • MULTI-WINNER • TRUSTLESS
          </p>
          <div style={{transform: 'scale(1.2)'}}>
             <ConnectButton />
          </div>
        </div>
        <p style={{marginTop: '30px', color: '#444', fontSize: '0.8rem'}}>POWERED BY SUI MOVE V3</p>
      </div>
    );
  }

  // 2. DASHBOARD
  return (
    <div style={{background: '#020205', minHeight: '100vh', color: 'white', fontFamily: 'Courier New, monospace', padding: '20px'}}>
      
      {/* NAVBAR */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        borderBottom: `1px solid ${THEME_COLOR}33`, paddingBottom: '20px', marginBottom: '50px'
      }}>
        <div style={{fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px'}}>
          <div style={{width: '15px', height: '15px', background: THEME_COLOR, borderRadius: '50%', boxShadow: `0 0 10px ${THEME_COLOR}`}}></div>
          PROTOCOL DASHBOARD
        </div>
        <ConnectButton />
      </nav>

      <div style={{maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px'}}>
        
        {/* KARTU 1: LAUNCHER */}
        <div style={{
          background: '#0a0a12', padding: '40px', borderRadius: '15px', border: `1px solid ${THEME_COLOR}22`,
          boxShadow: `0 0 30px rgba(0, 0, 0, 0.5)`
        }}>
          <h2 style={{marginTop: 0, color: 'white', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '25px'}}>
            🛠️ LAUNCH NEW POOL
          </h2>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            <div>
              <label style={labelStyle}>Ticket Price (SUI)</label>
              <input type="number" value={priceInput} onChange={e=>setPriceInput(e.target.value)} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Duration (Hours)</label>
              <input type="number" value={durationInput} onChange={e=>setDurationInput(e.target.value)} style={inputStyle}/>
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px'}}>
            <div>
              <label style={labelStyle}>Total Slots</label>
              <input type="number" value={slotInput} onChange={e=>setSlotInput(e.target.value)} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>🏆 Winners Count</label>
              <input type="number" value={winnerInput} onChange={e=>setWinnerInput(e.target.value)} style={{...inputStyle, borderColor: THEME_COLOR, background: `rgba(0, 229, 255, 0.1)`}}/>
            </div>
          </div>
            
          <button onClick={createPool} disabled={loading} style={{
              width: '100%', padding: '18px', background: THEME_COLOR, border: 'none', 
              fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px', marginTop: '25px',
              boxShadow: `0 0 20px ${THEME_COLOR}66`, color: '#000', fontSize: '1rem', letterSpacing: '1px'
          }}>
            {loading ? 'PROCESSING...' : '🚀 LAUNCH POOL'}
          </button>

          {/* --- AREA HASIL TRANSAKSI --- */}
          {successLink && (
            <div style={{marginTop: '20px', padding: '15px', border: '1px dashed #0aff0a', borderRadius: '10px', background: 'rgba(10,255,10,0.05)'}}>
               <p style={{margin: '0 0 10px 0', color: '#aaa', fontSize: '0.9rem'}}>✅ Pool Created! Check your ID here:</p>
               <a href={successLink} target="_blank" rel="noreferrer" style={{
                 display: 'block', textAlign: 'center', padding: '10px', background: '#0aff0a', 
                 color: 'black', fontWeight: 'bold', textDecoration: 'none', borderRadius: '5px'
               }}>
                 📄 LIHAT TIKET (EXPLORER)
               </a>
            </div>
          )}

        </div>

        {/* KARTU 2: JOINER */}
        <div style={{
          background: '#0a0a12', padding: '40px', borderRadius: '15px', border: `1px solid ${THEME_COLOR}22`,
          boxShadow: `0 0 30px rgba(0, 0, 0, 0.5)`
        }}>
          <h2 style={{marginTop: 0, color: THEME_COLOR, borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '25px'}}>
            🎟️ JOIN POOL
          </h2>
          
          <label style={labelStyle}>TARGET POOL ID</label>
          <input type="text" value={targetPool} onChange={e=>setTargetPool(e.target.value)} style={{...inputStyle, fontFamily: 'monospace', fontSize: '0.8rem'}}/>
          
          <div style={{
            background: `linear-gradient(45deg, rgba(0, 229, 255, 0.05) 0%, transparent 100%)`, 
            padding: '25px', borderRadius: '10px', margin: '25px 0', border: `1px dashed ${THEME_COLOR}44`
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
              <span style={{color:'#888', fontSize: '0.9rem'}}>ENTRY COST</span>
              <strong style={{color: 'white'}}>1 SUI</strong>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
              <span style={{color:'#888', fontSize: '0.9rem'}}>SETTLEMENT</span>
              <strong style={{color: THEME_COLOR}}>AUTO-TRIGGER</strong>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span style={{color:'#888', fontSize: '0.9rem'}}>WINNERS</span>
              <strong style={{color: THEME_COLOR}}>MULTI-WINNER ENABLED</strong>
            </div>
          </div>

          <button onClick={joinPool} disabled={loading} style={{
              width: '100%', padding: '18px', background: 'transparent', 
              border: `2px solid ${THEME_COLOR}`, color: THEME_COLOR, fontWeight: 'bold', 
              cursor: 'pointer', borderRadius: '5px', transition: '0.3s', fontSize: '1rem', letterSpacing: '1px'
          }}>
             {loading ? 'PROCESSING...' : 'BUY TICKET NOW'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;