import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useState, useEffect } from 'react';

// --- KONFIGURASI SMART CONTRACT ---
// PENTING: Ganti PACKAGE_ID ini setiap kali Anda melakukan 'sui client publish' ulang!
const PACKAGE_ID = '0x1a5d0c5d5b4c9f75f032071ee7f29216b665b3bb9200eb254c5777982b2b6d8a'; 
const MODULE = 'game';
const CLOCK_ID = '0x6';
const RANDOM_ID = '0x8';
const THEME_COLOR = '#00e5ff'; // Warna Cyan Neon

function App() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  // STATE: Kontrol masuk dashboard
  const [hasEntered, setHasEntered] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [targetPool, setTargetPool] = useState(""); // Kosongkan default agar user pakai hasil create
  const [successLink, setSuccessLink] = useState("");

  // State Input
  const [priceInput, setPriceInput] = useState("1");
  const [slotInput, setSlotInput] = useState("5");
  const [winnerInput, setWinnerInput] = useState("2"); 
  const [durationInput, setDurationInput] = useState("24");

  // Reset tombol enter jika wallet disconnect
  useEffect(() => {
    if (!account) setHasEntered(false);
  }, [account]);

  // --- LOGIC: CREATE POOL (DENGAN AUTO-CONNECT ID) ---
  const createPool = () => {
    if (!account) return;
    setLoading(true);
    setSuccessLink("");
    
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

    signAndExecute(
      { 
        transaction: tx,
        // Request data perubahan object untuk mengambil ID Pool baru
        options: { showObjectChanges: true } 
      }, 
      {
        onSuccess: (result) => {
          const digest = result.digest;
          setSuccessLink(`https://suiscan.xyz/testnet/tx/${digest}`);
          
          // --- LOGIKA AUTO DETECT ID POOL ---
          if (result.objectChanges) {
            // Cari object yang baru dibuat (created) dan tipenya adalah Pool
            const createdPool = result.objectChanges.find(
              (change) => change.type === 'created' && change.objectType.includes(`${MODULE}::Pool`)
            );

            // Jika ketemu, pasang ID-nya ke state targetPool
            if (createdPool && 'objectId' in createdPool) {
              setTargetPool(createdPool.objectId);
              alert(`✅ Pool Berhasil! ID ${createdPool.objectId.slice(0,6)}... otomatis terpasang di menu Join.`);
            }
          }
          
          setLoading(false); 
        },
        onError: (e) => { 
          alert('❌ Error: ' + e.message); 
          setLoading(false); 
        }
      }
    );
  };

  // --- LOGIC: JOIN POOL ---
  const joinPool = () => {
    if (!account) return;
    if (!targetPool) {
        alert("⚠️ Masukkan Pool ID terlebih dahulu (atau buat Pool baru)");
        return;
    }

    setLoading(true);
    const tx = new Transaction();
    // Harga tiket disesuaikan dengan input (disini hardcode 1 SUI sesuai tombol)
    // Sebaiknya dinamis, tapi untuk tes kita samakan dengan input create
    const TICKET_PRICE = parseFloat(priceInput) * 1_000_000_000; 
    
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(TICKET_PRICE)]);

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE}::buy_ticket`,
      arguments: [tx.object(targetPool), coin, tx.object(RANDOM_ID), tx.object(CLOCK_ID)],
    });

    signAndExecute({ transaction: tx }, {
      onSuccess: () => { alert('🎟️ Tiket Berhasil Dibeli!'); setLoading(false); },
      onError: (e) => { alert('❌ Error: ' + e.message); setLoading(false); }
    });
  };

  // =================================================================
  // 1. LANDING PAGE VIEW
  // =================================================================
  if (!account || !hasEntered) {
    return (
      <div style={{
        background: '#050508', minHeight: '100vh', color: 'white',
        fontFamily: '"Inter", sans-serif', overflow: 'hidden', position: 'relative',
        display: 'flex', alignItems: 'center', padding: '0 5%'
      }}>
        
        {/* Background Glows */}
        <div style={{position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', background: THEME_COLOR, filter: 'blur(200px)', opacity: 0.15, borderRadius: '50%'}}></div>
        <div style={{position: 'absolute', bottom: '-10%', right: '-5%', width: '500px', height: '500px', background: '#0066ff', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%'}}></div>

        <div style={{width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', alignItems: 'center', zIndex: 2}}>
            
            {/* KIRI: Hero Text */}
            <div>
                <div style={{
                    display: 'inline-block', padding: '8px 16px', borderRadius: '30px', 
                    background: 'rgba(0, 229, 255, 0.1)', border: `1px solid ${THEME_COLOR}44`,
                    color: THEME_COLOR, fontWeight: '600', fontSize: '0.85rem', marginBottom: '30px'
                }}>
                    Beta v1.0 • Sui Testnet
                </div>

                <h1 style={{
                    fontSize: '4.5rem', fontWeight: '800', lineHeight: '1.1', margin: '0 0 25px 0',
                    letterSpacing: '-2px'
                }}>
                    Create Crypto <br />
                    <span style={{
                        background: `linear-gradient(90deg, ${THEME_COLOR} 0%, #0066ff 100%)`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                        Automated Raffles
                    </span>
                </h1>

                <p style={{fontSize: '1.2rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '50px', maxWidth: '500px'}}>
                    Permissionless Web3 platform for transparent, multi-winner, and provably fair raffles on Sui Network.
                </p>

                <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                    {!account ? (
                        <div style={{transform: 'scale(1.1)', transformOrigin: 'left'}}>
                            <ConnectButton style={{background: THEME_COLOR, color: 'black', fontWeight: 'bold', padding: '15px 30px', borderRadius: '12px', border: 'none', cursor: 'pointer'}} />
                        </div>
                    ) : (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                             <button 
                                onClick={() => setHasEntered(true)}
                                style={{
                                    padding: '18px 40px', background: `linear-gradient(135deg, ${THEME_COLOR}, #0066ff)`,
                                    border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold', fontSize: '1.1rem',
                                    cursor: 'pointer', boxShadow: `0 10px 30px -5px ${THEME_COLOR}66`, transition: 'all 0.2s'
                                }}
                             >
                                ENTER DASHBOARD →
                             </button>
                             <div style={{fontSize: '0.8rem', color: '#64748b'}}>
                                Connected
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* KANAN: Visual 3D Mockup */}
            <div style={{display: 'none', '@media (min-width: 1000px)': {display: 'block'}, position: 'relative'}}> 
                <div style={{
                    background: 'rgba(20, 20, 30, 0.7)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px',
                    padding: '30px', transform: 'perspective(1000px) rotateY(-10deg) rotateX(5deg)',
                    boxShadow: '50px 50px 100px rgba(0,0,0,0.5)'
                }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '30px'}}>
                        <div>
                            <div style={{fontSize: '0.8rem', color: '#94a3b8'}}>Entry Price</div>
                            <div style={{fontWeight: 'bold', fontSize: '1.2rem'}}>1.0 SUI</div>
                        </div>
                        <div style={{textAlign: 'right'}}>
                            <div style={{fontSize: '0.8rem', color: '#94a3b8'}}>Status</div>
                            <div style={{color: THEME_COLOR, fontWeight: 'bold', background: 'rgba(0, 229, 255, 0.1)', padding: '2px 10px', borderRadius: '5px'}}>ACTIVE</div>
                        </div>
                    </div>
                    <div style={{
                        background: '#0a0a10', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                         <div style={{width: '50px', height: '50px', background: `linear-gradient(135deg, ${THEME_COLOR}, #0066ff)`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'}}>🎁</div>
                         <div>
                            <div style={{fontWeight: 'bold'}}>Grand Prize</div>
                            <div style={{fontSize: '0.9rem', color: '#64748b'}}>Pool Accumulation</div>
                         </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    );
  }

  // =================================================================
  // 2. DASHBOARD VIEW
  // =================================================================
  return (
    <div style={{
      background: 'radial-gradient(circle at top right, #1a1c4b 0%, #050508 100%)',
      minHeight: '100vh', color: '#e2e8f0', fontFamily: '"Inter", sans-serif', paddingBottom: '50px'
    }}>
      {/* NAVBAR */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px',
        background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{fontSize: '1.5rem', fontWeight: 800, background: `linear-gradient(90deg, ${THEME_COLOR}, #7000ff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
            SUI RAFFLE.
        </div>
        <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
             <button onClick={() => setHasEntered(false)} style={{background:'transparent', border:'none', color:'#64748b', cursor:'pointer', fontWeight:'bold'}}>
                EXIT
            </button>
            <ConnectButton />
        </div>
      </nav>

      <div style={{maxWidth: '1100px', margin: '60px auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px', padding: '0 20px'}}>
        
        {/* --- CARD 1: CREATOR --- */}
        <div style={{background: 'rgba(20, 20, 30, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '40px'}}>
          <h2 style={{marginTop: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px'}}>
             <span style={{background: 'rgba(0,255,100,0.1)', color:'#00ff66', padding:'5px 10px', borderRadius:'8px', fontSize:'0.8rem'}}>CREATOR</span>
             Launch Pool
          </h2>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '30px'}}>
            <div>
              <label style={{display:'block', marginBottom:'8px', fontSize:'0.85rem', color:'#94a3b8'}}>PRICE (SUI)</label>
              <input type="number" value={priceInput} onChange={e=>setPriceInput(e.target.value)} 
                style={{width:'100%', padding:'14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'12px', outline:'none', fontFamily:'monospace'}}/>
            </div>
            <div>
              <label style={{display:'block', marginBottom:'8px', fontSize:'0.85rem', color:'#94a3b8'}}>DURATION (H)</label>
              <input type="number" value={durationInput} onChange={e=>setDurationInput(e.target.value)} 
                style={{width:'100%', padding:'14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'12px', outline:'none', fontFamily:'monospace'}}/>
            </div>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px'}}>
             <div>
               <label style={{display:'block', marginBottom:'8px', fontSize:'0.85rem', color:'#94a3b8'}}>SLOTS</label>
               <input type="number" value={slotInput} onChange={e=>setSlotInput(e.target.value)} 
                 style={{width:'100%', padding:'14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'12px', outline:'none', fontFamily:'monospace'}}/>
             </div>
             <div>
               <label style={{display:'block', marginBottom:'8px', fontSize:'0.85rem', color:'#94a3b8'}}>WINNERS</label>
               <input type="number" value={winnerInput} onChange={e=>setWinnerInput(e.target.value)} 
                 style={{width:'100%', padding:'14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'12px', outline:'none', fontFamily:'monospace'}}/>
             </div>
          </div>

          <button onClick={createPool} disabled={loading} style={{
              width: '100%', padding: '16px', marginTop: '25px', background: `linear-gradient(135deg, ${THEME_COLOR} 0%, #0066ff 100%)`,
              border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            {loading ? 'PROCESSING...' : '🚀 LAUNCH POOL'}
          </button>

          {successLink && (
            <div style={{marginTop: '20px', textAlign: 'center'}}>
               <a href={successLink} target="_blank" rel="noreferrer" style={{color: '#00ff66', textDecoration: 'none', borderBottom: '1px dashed'}}>View Transaction ↗</a>
            </div>
          )}
        </div>

        {/* --- CARD 2: JOINER (AUTO-FILLED) --- */}
        <div style={{background: 'rgba(20, 20, 30, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '40px'}}>
          <h2 style={{marginTop: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px'}}>
             <span style={{background: 'rgba(0,240,255,0.1)', color:'#00f0ff', padding:'5px 10px', borderRadius:'8px', fontSize:'0.8rem'}}>PLAYER</span>
             Join Pool
          </h2>
          
          <div style={{marginTop: '30px'}}>
            <label style={{display:'block', marginBottom:'8px', fontSize:'0.85rem', color:'#94a3b8'}}>POOL ID (Auto-filled after create)</label>
            <input type="text" value={targetPool} onChange={e=>setTargetPool(e.target.value)} 
                placeholder="0x..."
                style={{width:'100%', padding:'14px', background:'rgba(0,0,0,0.3)', border:`1px solid ${THEME_COLOR}44`, color: THEME_COLOR, borderRadius:'12px', outline:'none', fontFamily:'monospace'}}/>
          </div>

          <div style={{background: `rgba(0, 229, 255, 0.05)`, padding: '20px', borderRadius: '16px', marginTop: '20px', border: `1px solid ${THEME_COLOR}22`}}>
             <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', fontSize:'0.9rem'}}><span style={{color:'#94a3b8'}}>Entry Cost</span> <strong>{priceInput} SUI</strong></div>
             <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem'}}><span style={{color:'#94a3b8'}}>Fairness</span> <strong style={{color: THEME_COLOR}}>Provably Fair</strong></div>
          </div>

          <button onClick={joinPool} disabled={loading} style={{
              width: '100%', padding: '16px', marginTop: '25px', background: 'transparent',
              border: `1px solid ${THEME_COLOR}66`, borderRadius: '12px', color: THEME_COLOR, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer'
          }}>
             {loading ? 'WAITING...' : 'BUY TICKET NOW'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;