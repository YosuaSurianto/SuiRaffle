module sui_raffle::game {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::random::{Self, Random};
    use sui::clock::{Self, Clock};
    use sui::event;

    // --- KONSTANTA FEE ---
    const PLATFORM_FEE_BPS: u64 = 500; // 5%
    const CREATOR_FEE_BPS: u64 = 500;  // 5%
    const PLATFORM_ADDRESS: address = @0xfa7e149fbfb485f84c9a77c7248387ca432110c15deb9fbfe501fa481a8387b5; 

    // --- ERROR CODES (Kamus Error) ---
    const EInsufficientPayment: u64 = 0;
    const EPoolFull: u64 = 1;
    const ETimeNotReached: u64 = 2;
    const EAlreadySettled: u64 = 3;
    const ETimeExpired: u64 = 4;
    const EInvalidWinnerCount: u64 = 5; // <--- Error baru: Pemenang kebanyakan

    // --- STRUCT (Gudang Data) ---
    public struct RafflePool has key, store {
        id: UID,
        creator: address,
        ticket_price: u64,
        max_tickets: u64,
        num_winners: u64,       // <--- KOLOM BARU: Nyimpen target jumlah pemenang
        tickets_sold: u64,
        balance: Balance<SUI>,
        participants: vector<address>,
        end_time: u64,
        is_settled: bool
    }

    // --- EVENTS (Laporan ke Frontend) ---
    public struct PoolCreated has copy, drop {
        pool_id: ID,
        creator: address,
        price: u64,
        max_tickets: u64,
        num_winners: u64,
        end_time: u64
    }

    public struct WinnerDrawn has copy, drop {
        pool_id: ID,
        winner: address,
        prize: u64
    }

    // --- FUNGSI 1: CREATE POOL ---
    public fun create_pool(
        ticket_price: u64, 
        max_tickets: u64, 
        num_winners: u64, // <--- User wajib isi ini nanti
        duration_hours: u64, 
        clock: &Clock, 
        ctx: &mut TxContext
    ) {
        // VALIDASI PENTING: Pemenang harus logis
        // Gak boleh 0, dan gak boleh lebih banyak dari tiket
        assert!(num_winners > 0 && num_winners <= max_tickets, EInvalidWinnerCount);

        let deadline = clock::timestamp_ms(clock) + (duration_hours * 60 * 60 * 1000);
        let pool_uid = object::new(ctx);
        let pool_id = object::uid_to_inner(&pool_uid);
        let sender = ctx.sender();

        let pool = RafflePool {
            id: pool_uid,
            creator: sender,
            ticket_price,
            max_tickets,
            num_winners, // Disimpan ke gudang
            tickets_sold: 0,
            balance: balance::zero(),
            participants: vector::empty(),
            end_time: deadline,
            is_settled: false
        };

        event::emit(PoolCreated {
            pool_id,
            creator: sender,
            price: ticket_price,
            max_tickets,
            num_winners,
            end_time: deadline
        });

        transfer::share_object(pool);
    }

    // --- FUNGSI 2: BELI TIKET (Gak banyak berubah) ---
    entry fun buy_ticket(
        pool: &mut RafflePool, 
        payment: Coin<SUI>, 
        r: &Random, 
        clock: &Clock, 
        ctx: &mut TxContext
    ) {
        assert!(clock::timestamp_ms(clock) < pool.end_time, ETimeExpired);
        assert!(pool.tickets_sold < pool.max_tickets, EPoolFull);
        assert!(!pool.is_settled, EAlreadySettled);
        assert!(payment.value() == pool.ticket_price, EInsufficientPayment);

        let coin_balance = payment.into_balance();
        pool.balance.join(coin_balance);
        pool.participants.push_back(ctx.sender());
        pool.tickets_sold = pool.tickets_sold + 1;

        // Auto-Trigger: Kalau penuh, langsung undi!
        if (pool.tickets_sold == pool.max_tickets) {
            settle_pool(pool, r, ctx);
        }
    }

    // --- FUNGSI 3: UNDIAN (LOGIKA BARU DI SINI) ---
    fun settle_pool(pool: &mut RafflePool, r: &Random, ctx: &mut TxContext) {
        pool.is_settled = true;

        // A. Hitung Duit
        let total_funds = pool.balance.value();
        let creator_cut = (total_funds * CREATOR_FEE_BPS) / 10000;
        let platform_cut = (total_funds * PLATFORM_FEE_BPS) / 10000;
        
        // Sisa 90% dibagi rata ke jumlah pemenang
        let prize_pool = total_funds - creator_cut - platform_cut;
        let prize_per_winner = prize_pool / pool.num_winners; 

        // B. Bayar Fee Dulu
        let pay_creator = coin::take(&mut pool.balance, creator_cut, ctx);
        transfer::public_transfer(pay_creator, pool.creator);
        let pay_platform = coin::take(&mut pool.balance, platform_cut, ctx);
        transfer::public_transfer(pay_platform, PLATFORM_ADDRESS);

        // C. LOGIKA KOCOK PEMENANG (Looping)
        let mut generator = random::new_generator(r, ctx);
        let mut i = 0;

        // "Selama jumlah pemenang belum terpenuhi, kocok lagi"
        while (i < pool.num_winners) {
            // 1. Hitung sisa peserta
            let len = pool.participants.length();
            
            // 2. Pilih nomor acak dari sisa peserta
            let index = random::generate_u64_in_range(&mut generator, 0, len); 
            
            // 3. AMBIL & HAPUS (Swap Remove)
            // Ini kuncinya: function ini mengambil orang di index tersebut,
            // lalu menghapusnya dari list peserta. Jadi dia gak bisa menang 2x.
            let winner = pool.participants.swap_remove(index);

            // 4. Transfer Hadiah
            let pay_winner = coin::take(&mut pool.balance, prize_per_winner, ctx);
            transfer::public_transfer(pay_winner, winner);

            // 5. Kabari dunia
            event::emit(WinnerDrawn {
                pool_id: object::uid_to_inner(&pool.id),
                winner,
                prize: prize_per_winner
            });

            // Lanjut ke pemenang berikutnya
            i = i + 1;
        };
    }
}