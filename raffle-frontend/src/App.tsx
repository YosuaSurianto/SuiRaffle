import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useState } from 'react';

// ==========================================
// 🛑 JANGAN LUPA SAVE ID MU DI SINI 🛑
// ==========================================
const PACKAGE_ID = '0x552c96ca529712f2c9dcb0b8c3eb1e46828468f11e9e445cde80c650ccd3338f'; 
const TEST_POOL_ID = '0xc9343be1ac1d15b3d7eec210e0c475f2793470d73cc1a57113784a467dc90f98';
// ==========================================

const MODULE = 'game';
const CLOCK_ID = '0x6';
const RANDOM_ID = '0x8';

function App() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [loading, setLoading] = useState(false);
  const [targetPool, setTargetPool] = useState(TEST_POOL_ID);
  
  // State Input Dashboard
  const [priceInput, setPriceInput] = useState("1");
  const [slotInput, setSlotInput] = useState("5");
  const [durationInput, setDurationInput] = useState("24");

  // --- LOGIC: CREATE POOL ---
  const createPool = () => {
    setLoading(true);
    const tx = new Transaction();
    const priceInMist = parseFloat(priceInput) * 1_000_000_000;
    
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE}::create_pool`,
      arguments: [tx.pure.u64(priceInMist), tx.pure.u64(Number(slotInput)), tx.pure.u64(Number(durationInput)), tx.object(CLOCK_ID)],
    });

    signAndExecute({ transaction: tx }, {
      onSuccess: () => { alert('✅ POOL LAUNCHED!'); setLoading(false); },
      onError: (e) => { alert('❌ FAILED: ' + e.message); setLoading(false); }
    });
  };

  // --- LOGIC: JOIN POOL ---
  const joinPool = () => {
    setLoading(true);
    const tx = new Transaction();
    const TICKET_PRICE = 1_000_000_000; 
    const [coin] = tx.splitCoins(tx.gas, [TICKET_PRICE]);

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE}::buy_ticket`,
      arguments: [tx.object(targetPool), coin, tx.object(RANDOM_ID), tx.object(CLOCK_ID)],
    });

    signAndExecute({ transaction: tx }, {
      onSuccess: () => { alert('🎟️ TICKET PURCHASED!'); setLoading(false); },
      onError: (e) => { alert('❌ FAILED: ' + e.message); setLoading(false); }
    });
  };

  // --- TAMPILAN 1: LANDING PAGE (Kalau belum connect wallet) ---
  if (!account) {
    return (
      <div style={{
        background: 'linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.9)), url("https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop")',
        backgroundSize: 'cover',
        minHeight: '100vh',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1 style={{fontSize: '4rem', marginBottom: '10px', textShadow: '0 0 20px #0aff0a', color: '#0aff0a'}}>SUI RAFFLE PROTOCOL</h1>
        <p style={{fontSize: '1.5rem', maxWidth: '600px', marginBottom: '40px', color: '#ddd'}}>
          The first decentralized fair-launch raffle platform. Create your own pool, invite friends, and win instant liquidity.
        </p>
        
        <div style={{transform: 'scale(1.5)', padding: '20px', border: '1px solid #0aff0a', borderRadius: '10px', background: 'rgba(0,0,0,0.8)'}}>
          <p style={{fontSize: '0.9rem', color: '#aaa', marginBottom: '10px'}}>Connect Wallet to Enter Dashboard</p>
          <ConnectButton />
        </div>

        <footer style={{position: 'absolute', bottom: '20px', color: '#555'}}>
          Built on SUI Network • Testnet V2
        </footer>
      </div>
    );
  }

  // --- TAMPILAN 2: DASHBOARD (Kalau sudah connect) ---
  return (
    <div style={{background: '#111', minHeight: '100vh', color: 'white', fontFamily: 'monospace', padding: '20px'}}>
      <nav style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '40px'}}>
        <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#0aff0a'}}>🟢 PROTOCOL DASHBOARD</div>
        <ConnectButton />
      </nav>

      <div style={{maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px'}}>
        
        {/* CARD CREATE */}
        <div style={{background: '#1a1a1a', padding: '30px', borderRadius: '15px', border: '1px solid #333'}}>
          <h2 style={{marginTop: 0}}>🛠️ Launch Pool</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', color: '#aaa'}}>Ticket Price (SUI)</label>
              <input type="number" value={priceInput} onChange={e=>setPriceInput(e.target.value)} style={{width: '90%', padding: '12px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '5px'}}/>
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '5px', color: '#aaa'}}>Max Slots</label>
              <input type="number" value={slotInput} onChange={e=>setSlotInput(e.target.value)} style={{width: '90%', padding: '12px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '5px'}}/>
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '5px', color: '#aaa'}}>Duration (Hours)</label>
              <input type="number" value={durationInput} onChange={e=>setDurationInput(e.target.value)} style={{width: '90%', padding: '12px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '5px'}}/>
            </div>
            <button onClick={createPool} disabled={loading} style={{padding: '15px', background: '#0aff0a', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px', marginTop: '10px'}}>
              {loading ? 'LAUNCHING...' : '🚀 LAUNCH POOL'}
            </button>
          </div>
        </div>

        {/* CARD JOIN */}
        <div style={{background: '#1a1a1a', padding: '30px', borderRadius: '15px', border: '1px solid #333'}}>
          <h2 style={{marginTop: 0}}>🎟️ Join Pool</h2>
          <p style={{color: '#aaa', fontSize: '0.9rem'}}>Enter a Game ID to participate.</p>
          <input type="text" value={targetPool} onChange={e=>setTargetPool(e.target.value)} style={{width: '90%', padding: '12px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '5px', marginBottom: '20px'}}/>
          
          <div style={{background: 'rgba(10, 255, 10, 0.1)', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #0aff0a'}}>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span>Entry Cost:</span>
              <strong>1 SUI</strong>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '5px'}}>
              <span>Win Probability:</span>
              <strong>20% (if 5 slots)</strong>
            </div>
          </div>

          <button onClick={joinPool} disabled={loading} style={{width: '100%', padding: '15px', background: 'transparent', border: '2px solid #0aff0a', color: '#0aff0a', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px'}}>
             {loading ? 'BUYING...' : 'BUY TICKET'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;