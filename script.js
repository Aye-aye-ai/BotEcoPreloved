const DB_REQ = 'ph_demo_reqs_v2';
const DB_OFFER = 'ph_demo_offers_v2';
const DB_CART = 'ph_demo_cart_v2';
const DB_ORDER = 'ph_demo_order_v2';
const DB_CHAT = 'ph_demo_chat_v2';
        
let activeSellerId = null;
let activeCategory = 'Semua';

const SELLERS = {
    'seller1': { name: 'Toko A (Berkah)', color: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-600' },
    'seller2': { name: 'Toko B (Gadget)', color: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-600' },
    'seller3': { name: 'Toko C (Hobi)', color: 'bg-orange-600', light: 'bg-orange-50', text: 'text-orange-600' }
};

window.onload = () => {
    renderBuyer();
    updateCartBadge();
    renderHistory();
    initMap();
};

function activateSeller(sellerId) {
    activeSellerId = sellerId === 'none' ? null : sellerId;
    const panel = document.getElementById('seller-panel');
    
    ['none', 'seller1', 'seller2', 'seller3'].forEach(id => {
        const btn = document.getElementById('btn-'+id);
        btn.className = "px-4 py-1.5 rounded-full text-xs font-bold transition text-slate-400 hover:text-white hover:bg-slate-700";
    });

    if (activeSellerId) {
        panel.style.width = '50%'; 
        const activeBtn = document.getElementById('btn-'+activeSellerId);
        const sData = SELLERS[activeSellerId];
        activeBtn.className = `px-4 py-1.5 rounded-full text-xs font-bold transition text-white ${sData.color.replace('text','bg')}`; 
        
        document.getElementById('seller-name').innerText = sData.name;
        const avatar = document.getElementById('seller-avatar');
        avatar.className = `w-10 h-10 rounded-full ${sData.light} flex items-center justify-center ${sData.text} font-bold shadow-sm transition-colors duration-300`;
        
        renderSeller();
    } else {
        panel.style.width = '0%';
        document.getElementById('btn-none').className = "px-4 py-1.5 rounded-full text-xs font-bold transition bg-slate-700 text-white";
    }
}

function setCat(cat) {
    activeCategory = cat;
    renderBuyer();
}

function sendRequest() {
    const input = document.getElementById('buyer-input');
    if(!input.value.trim()) return;

    const reqs = getStorage(DB_REQ);
    reqs.push({ id: Date.now(), text: input.value, cat: activeCategory, time: Date.now() });
    saveStorage(DB_REQ, reqs);
    input.value = '';
    
    renderBuyer();
    if(activeSellerId) renderSeller();
}

function extractYouTubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function renderBuyer() {
    let reqs = getStorage(DB_REQ).reverse();
    if(activeCategory !== 'Semua') {
        reqs = reqs.filter(r => r.cat === activeCategory);
    }
    
    const offers = getStorage(DB_OFFER);
    const container = document.getElementById('buyer-feed');

    if(reqs.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 opacity-40">
                <i class="fa-solid fa-basket-shopping text-5xl mb-3 text-slate-300"></i>
                <p class="text-xs text-slate-500 font-medium">Belum ada request</p>
            </div>`;
        return;
    }

    container.innerHTML = reqs.map(r => {
        const items = offers.filter(o => o.reqId == r.id).sort((a,b) => a.price - b.price);
        
        return `
        <div class="pop-in group mb-6">
            <div class="flex justify-end mb-2">
                <div class="bg-slate-800 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-xs shadow-md max-w-[85%] relative">
                    <span class="absolute -top-4 right-0 text-[9px] text-slate-400 font-bold bg-white px-1.5 rounded border">${r.cat}</span>
                    "${r.text}"
                </div>
            </div>

            <div class="flex items-center gap-2 mb-3 px-2">
                <div class="h-px bg-slate-200 flex-1"></div>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">${items.length} Penawaran</span>
                <div class="h-px bg-slate-200 flex-1"></div>
            </div>

            ${items.length > 0 ? `
                <div class="grid grid-cols-1 gap-3">
                    ${items.map(item => {
                        // RENDER MEDIA (YOUTUBE / TIKTOK / LOKAL)
                        let mediaHtml = '';
                        if(item.vid && item.vid.trim() !== '') {
                            let safeUrl = item.vid.trim();
                            let ytId = extractYouTubeID(safeUrl);
                            
                            if(ytId) {
                                // YouTube thumbnail
                                mediaHtml = `
                                    <div class="mt-2 mb-1 relative rounded-lg overflow-hidden border border-slate-200 group/vid">
                                        <img src="https://img.youtube.com/vi/${ytId}/hqdefault.jpg" class="w-full h-32 object-cover">
                                        <a href="${safeUrl}" target="_blank" class="absolute inset-0 bg-black/40 flex items-center justify-center transition hover:bg-black/50">
                                            <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg group-hover/vid:scale-110 transition">
                                                <i class="fa-solid fa-play ml-1"></i>
                                            </div>
                                        </a>
                                    </div>
                                `;
                            } else if(safeUrl.startsWith('blob:') || safeUrl.match(/\.(mp4|webm|ogg)$/i)) {
                                // Local Video Player
                                mediaHtml = `
                                    <div class="mt-2 mb-1 rounded-lg overflow-hidden border border-slate-200 bg-black">
                                        <video src="${safeUrl}" controls class="w-full h-32 object-contain" preload="metadata"></video>
                                    </div>
                                `;
                            } else {
                                // Link External (TikTok, IG, dll)
                                if (!safeUrl.startsWith('http')) safeUrl = 'https://' + safeUrl;
                                mediaHtml = `
                                    <a href="${safeUrl}" target="_blank" class="w-full mt-2 mb-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-[10px] py-2 rounded-md font-bold transition">
                                        <i class="fa-solid fa-video text-indigo-500"></i> Buka Link Video
                                    </a>
                                `;
                            }
                        }

                        return `
                        <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col transition hover:shadow-md">
                            <div class="flex gap-3">
                                <div class="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                    <img src="${item.img}" class="w-full h-full object-cover">
                                </div>
                                <div class="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div class="flex justify-between items-start">
                                            <h4 class="font-bold text-xs text-slate-700 line-clamp-1">${item.item}</h4>
                                            <span class="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">${item.cond}</span>
                                        </div>
                                        <div class="flex justify-between items-center mt-0.5">
                                            <p class="text-[10px] text-slate-400"><i class="fa-solid fa-store"></i> ${item.sellerName}</p>
                                            <p class="text-[9px] text-slate-500 font-bold">Stok: ${item.qty || 1}</p>
                                        </div>
                                    </div>
                                    <div class="flex justify-between items-end mt-1">
                                        <span class="text-xs font-bold text-rose-600">Rp ${parseInt(item.price).toLocaleString()}</span>
                                        <button onclick="window.open('https://wa.me/${item.phone}?text=Minat ${item.item}', '_blank')" class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:scale-110 transition" title="WhatsApp">
                                            <i class="fa-brands fa-whatsapp text-[10px]"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            ${mediaHtml}

                            <div class="flex gap-2 mt-2 w-full">
                                <button onclick="addToCart(${item.id})" class="flex-1 bg-slate-900 text-white text-[10px] py-1.5 rounded-md font-bold hover:bg-slate-800 transition shadow-sm">
                                    <i class="fa-solid fa-cart-plus"></i> Cart
                                </button>
                                <button onclick="openChat(${item.id}, '${item.sellerName}')" class="flex-1 bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] py-1.5 rounded-md font-bold hover:bg-indigo-100 transition shadow-sm">
                                    <i class="fa-regular fa-message"></i> Chat
                                </button>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            ` : `
                <div class="bg-white border-2 border-dashed border-slate-100 rounded-xl p-3 text-center">
                    <i class="fa-solid fa-hourglass-half text-slate-300 mb-1"></i>
                    <p class="text-[10px] text-slate-400">Menunggu seller...</p>
                </div>
            `}
        </div>
        `;
    }).join('');
}

function addToCart(offerId) {
    const offers = getStorage(DB_OFFER);
    const item = offers.find(o => o.id === offerId);
    if(!item) return;

    let cart = getStorage(DB_CART);
    let existing = cart.find(c => c.offerId === offerId);
    
    if(existing) {
        if(existing.buyQty < (item.qty || 1)) {
            existing.buyQty++;
            showToast("🛒 Kuantitas ditambah!");
        } else {
            showToast(`⚠️ Stok maksimum tercapai!`, true);
        }
    } else {
        try {
            let cleanItem = Object.assign({}, item);
            cleanItem.img = null; 
            cart.push({ cartId: Date.now(), offerId: item.id, itemData: cleanItem, buyQty: 1 });
            saveStorage(DB_CART, cart);
            showToast("🛒 Masuk Cart!");
        } catch(e) { alert("⚠️ Memori browser penuh!"); }
    }
    updateCartBadge();
    renderCart();
}

function updateCartBadge() {
    const cart = getStorage(DB_CART);
    const badge = document.getElementById('cart-badge');
    if(cart.length > 0) {
        badge.innerText = cart.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal.classList.contains('active')) {
        modal.classList.remove('active');
    } else {
        if(modalId === 'cart-modal') renderCart();
        if(modalId === 'history-modal') renderHistory();
        modal.classList.add('active');
    }
}

function renderCart() {
    const cart = getStorage(DB_CART);
    const allOffers = getStorage(DB_OFFER); 
    const container = document.getElementById('cart-items');
    
    if(cart.length === 0) {
        container.innerHTML = `<p class="text-center text-xs text-slate-400 my-6">Keranjang kosong.</p>`;
        document.getElementById('cart-subtotal').innerText = 'Rp 0';
        document.getElementById('cart-shipping').innerText = 'Rp 0';
        document.getElementById('cart-fee').innerText = 'Rp 0';
        document.getElementById('cart-total').innerText = 'Rp 0';
        return;
    }

    let subtotal = 0;
    container.innerHTML = cart.map((c, index) => {
        const totalItemPrice = c.itemData.price * c.buyQty;
        subtotal += totalItemPrice;
        const originalOffer = allOffers.find(o => o.id === c.offerId);
        const imgSrc = originalOffer && originalOffer.img ? originalOffer.img : '';

        return `
        <div class="flex gap-3 bg-white border border-slate-100 p-2 rounded-lg shadow-sm">
            <img src="${imgSrc}" class="w-12 h-12 object-cover rounded bg-slate-100">
            <div class="flex-1 flex flex-col justify-between">
                <div class="flex justify-between">
                    <h5 class="text-xs font-bold text-slate-700 leading-tight">${c.itemData.item}</h5>
                    <button onclick="removeFromCart(${index})" class="text-slate-300 hover:text-rose-500"><i class="fa-solid fa-trash text-[10px]"></i></button>
                </div>
                <div class="flex justify-between items-end">
                    <span class="text-[10px] text-slate-500 font-bold">Rp ${parseInt(c.itemData.price).toLocaleString()} x ${c.buyQty}</span>
                    <span class="text-xs font-bold text-rose-600">Rp ${totalItemPrice.toLocaleString()}</span>
                </div>
            </div>
        </div>`;
    }).join('');

    const shipping = cart.length * 15000; 
    const fee = subtotal * 0.05; 
    const finalTotal = subtotal + shipping + fee;

    document.getElementById('cart-subtotal').innerText = `Rp ${subtotal.toLocaleString()}`;
    document.getElementById('cart-shipping').innerText = `Rp ${shipping.toLocaleString()}`;
    document.getElementById('cart-fee').innerText = `Rp ${fee.toLocaleString()}`;
    document.getElementById('cart-total').innerText = `Rp ${finalTotal.toLocaleString()}`;
    container.dataset.finalTotal = finalTotal;
}

function removeFromCart(index) {
    let cart = getStorage(DB_CART);
    cart.splice(index, 1);
    saveStorage(DB_CART, cart);
    updateCartBadge();
    renderCart();
}


function processCheckout() {
    const cart = getStorage(DB_CART);
    if(cart.length === 0) return showToast("⚠️ Keranjang kosong!", true);
    const address = document.getElementById('buyer-address').value;
    if(!address.trim()) return showToast("⚠️ Masukkan alamat pengiriman!", true);

    const container = document.getElementById('cart-items');
    container.dataset.tempAddress = address; 
    const total = parseInt(container.dataset.finalTotal || 0);
    
    document.getElementById('va-number').innerText = "8077 " + Math.floor(1000 + Math.random() * 9000) + " " + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('pay-total').innerText = `Rp ${total.toLocaleString()}`;

    toggleModal('cart-modal');
    setTimeout(() => toggleModal('payment-modal'), 300);
}

function confirmPayment() {
    const btn = document.getElementById('btn-confirm-pay');
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Memverifikasi...`;
    btn.disabled = true;

    setTimeout(() => {
        finalizeOrder();
        btn.innerHTML = `<i class="fa-solid fa-check-circle"></i> Bayar & Verifikasi Sekarang`;
        btn.disabled = false;
    }, 2000);
}

function finalizeOrder() {
    const cart = getStorage(DB_CART);
    const container = document.getElementById('cart-items');
    const total = parseInt(container.dataset.finalTotal || 0);
    const address = container.dataset.tempAddress;

    const orders = getStorage(DB_ORDER);
    try {
        orders.push({ id: 'ORD-' + Date.now(), items: cart, total: total, address: address, date: new Date().toLocaleString('id-ID') });
        saveStorage(DB_ORDER, orders);
        saveStorage(DB_CART, []);
        updateCartBadge();
        document.getElementById('buyer-address').value = '';
        
        toggleModal('payment-modal');
        showToast("✅ Pembayaran Berhasil!");
        renderHistory();

        setTimeout(() => {
            const historyModal = document.getElementById('history-modal');
            if (!historyModal.classList.contains('active')) historyModal.classList.add('active');
        }, 400);
    } catch(e) { alert("⚠️ Memori Penuh!"); }
}

function renderHistory() {
    const orders = getStorage(DB_ORDER).reverse();
    const container = document.getElementById('history-list');

    if(orders.length === 0) {
        container.innerHTML = `<p class="text-center text-xs text-slate-400 mt-10">Belum ada histori.</p>`;
        return;
    }

    container.innerHTML = orders.map(o => `
        <div class="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
            <div class="flex justify-between border-b border-slate-100 pb-2 mb-2">
                <span class="text-[10px] font-bold text-slate-500">${o.id}</span>
                <span class="text-[9px] text-slate-400">${o.date}</span>
            </div>
            <div class="space-y-1 mb-2">
                ${o.items.map(i => `
                    <div class="flex justify-between text-[10px]">
                        <span class="text-slate-600 line-clamp-1 flex-1">${i.itemData.item} <b class="text-slate-400">(x${i.buyQty})</b></span>
                    </div>
                `).join('')}
            </div>
            <div class="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                <span class="text-[10px] text-slate-500 font-medium">Total:</span>
                <span class="text-xs font-bold text-emerald-600">Rp ${o.total.toLocaleString()}</span>
            </div>
        </div>
    `).join('');
}

function openChat(offerId, sellerName) {
    document.getElementById('chat-active-id').value = offerId;
    document.getElementById('chat-title').innerText = sellerName;
    toggleModal('chat-modal');
    renderChat();
}

function renderChat() {
    const offerId = document.getElementById('chat-active-id').value;
    const chats = getStorage(DB_CHAT);
    const container = document.getElementById('chat-messages');

    const thread = chats.find(c => c.offerId == offerId);
    if(!thread || thread.messages.length === 0) {
        container.innerHTML = `<p class="text-center text-[10px] text-slate-400 mt-4">Kirim pesan pertamamu!</p>`;
        return;
    }

    container.innerHTML = thread.messages.map(m => `
        <div class="flex ${m.sender === 'buyer' ? 'justify-end' : 'justify-start'}">
            <div class="max-w-[80%] p-2.5 rounded-xl text-xs ${m.sender === 'buyer' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'}">
                ${m.text}
            </div>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const offerId = document.getElementById('chat-active-id').value;
    if(!text || !offerId) return;

    const chats = getStorage(DB_CHAT);
    let thread = chats.find(c => c.offerId == offerId);
    
    if(!thread) {
        thread = { offerId: offerId, messages: [] };
        chats.push(thread);
    }

    thread.messages.push({ sender: 'buyer', text: text, time: Date.now() });
    
    setTimeout(() => {
        thread.messages.push({ sender: 'seller', text: 'Halo kak, barang ready. Silahkan diorder ya!', time: Date.now() });
        saveStorage(DB_CHAT, chats);
        if(document.getElementById('chat-modal').classList.contains('active')) renderChat();
    }, 1000);

    saveStorage(DB_CHAT, chats);
    input.value = '';
    renderChat();
}

function renderSeller() {
    if(!activeSellerId) return;
    
    const reqs = getStorage(DB_REQ).reverse();
    const offers = getStorage(DB_OFFER);
    const container = document.getElementById('seller-feed');
    const sData = SELLERS[activeSellerId];

    if(reqs.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-400 text-sm mt-10">Belum ada request.</div>`;
        return;
    }

    container.innerHTML = reqs.map(r => {
        const myItems = offers.filter(o => o.reqId == r.id && o.sellerId == activeSellerId);

        return `
        <div class="bg-white p-5 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-slate-100 slide-in-right relative overflow-hidden group">
            <div class="absolute top-0 left-0 w-1 h-full ${sData.color}"></div>
            
            <div class="flex justify-between items-start mb-4 pl-2">
                <div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REQUEST PEMBELI</span>
                    <h3 class="text-slate-800 font-bold text-lg leading-tight mt-1">"${r.text}"</h3>
                </div>
            </div>

            <div class="bg-slate-50/80 p-4 rounded-xl border border-slate-100 pl-2">
                
                <div class="flex gap-3 mb-3">
                    
                    <label class="w-20 h-20 bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition relative overflow-hidden shrink-0 group/img" title="Upload Foto Barang">
                        <input type="file" id="file-${r.id}" class="hidden" accept="image/*" onchange="previewImg(this, ${r.id})">
                        <i class="fa-solid fa-camera text-slate-300 text-xl group-hover/img:text-indigo-400 transition" id="icon-${r.id}"></i>
                        <img id="img-${r.id}" class="absolute inset-0 w-full h-full object-cover hidden">
                    </label>

                    <label class="w-20 h-20 bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 transition relative overflow-hidden shrink-0 group/vid" title="Upload Video dari HP/Laptop">
                        <input type="file" id="local-vid-${r.id}" class="hidden" accept="video/*" onchange="previewVid(this, ${r.id})">
                        <i class="fa-solid fa-video text-slate-300 text-xl group-hover/vid:text-rose-400 transition" id="vid-icon-${r.id}"></i>
                        <video id="vid-preview-${r.id}" class="absolute inset-0 w-full h-full object-cover hidden" muted></video>
                    </label>

                    <div class="flex-1 space-y-2">
                        <input id="name-${r.id}" type="text" placeholder="Nama Barang" class="w-full text-xs p-2 rounded-lg demo-input bg-white">
                        <div class="flex gap-2">
                            <input id="price-${r.id}" type="number" placeholder="Harga" class="w-2/3 text-xs p-2 rounded-lg demo-input bg-white">
                            <select id="cond-${r.id}" class="w-1/3 text-xs p-1 rounded-lg demo-input bg-white">
                                <option>Bekas</option>
                                <option>Baru</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="flex gap-2 mb-2">
                    <div class="relative w-1/4">
                        <input id="qty-${r.id}" type="number" placeholder="Stok" class="w-full text-xs p-2 pl-7 rounded-lg demo-input bg-white" min="1" value="1">
                        <i class="fa-solid fa-boxes-stacked absolute left-2.5 top-2.5 text-slate-400 text-[10px]"></i>
                    </div>
                    <div class="relative w-3/4 flex gap-1">
                        <div class="relative flex-1">
                            <input id="vid-link-${r.id}" type="text" placeholder="Paste link video (YouTube/TikTok)..." class="w-full text-xs p-2 pl-7 rounded-lg demo-input bg-white">
                            <i class="fa-solid fa-link absolute left-2.5 top-2.5 text-slate-500 text-[11px]"></i>
                        </div>
                    </div>
                </div>
                
                <div class="relative mb-3">
                    <input id="phone-${r.id}" type="tel" placeholder="Nomor WA (0812...)" class="w-full text-xs pl-8 p-2 rounded-lg demo-input bg-white" value="${getLastPhone()}">
                    <i class="fa-brands fa-whatsapp absolute left-3 top-2.5 text-emerald-500 text-xs"></i>
                </div>

                <button onclick="submitOffer(${r.id})" class="w-full ${sData.color} text-white py-2.5 rounded-lg text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition flex justify-center items-center gap-2">
                    <i class="fa-solid fa-paper-plane"></i> Kirim Penawaran
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function previewImg(input, id) {
    if(input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById(`img-${id}`);
            const icon = document.getElementById(`icon-${id}`);
            img.src = e.target.result;
            img.classList.remove('hidden');
            icon.classList.add('hidden');
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// FUNGSI PREVIEW VIDEO LOKAL
function previewVid(input, id) {
    if(input.files && input.files[0]) {
        const file = input.files[0];
        const videoUrl = URL.createObjectURL(file);
        const vidEl = document.getElementById(`vid-preview-${id}`);
        const icon = document.getElementById(`vid-icon-${id}`);
        const linkInput = document.getElementById(`vid-link-${id}`);
        
        vidEl.src = videoUrl;
        vidEl.classList.remove('hidden');
        icon.classList.add('hidden');
        
        linkInput.value = videoUrl;
        showToast("✅ Video Lokal Siap!");
    }
}

function submitOffer(reqId) {
    const nameEl = document.getElementById(`name-${reqId}`);
    const priceEl = document.getElementById(`price-${reqId}`);
    const condEl = document.getElementById(`cond-${reqId}`);
    const phoneEl = document.getElementById(`phone-${reqId}`);
    const qtyEl = document.getElementById(`qty-${reqId}`);
    const vidLinkEl = document.getElementById(`vid-link-${reqId}`); 
    const imgEl = document.getElementById(`img-${reqId}`);
    
    if(!nameEl.value || !priceEl.value || !phoneEl.value || imgEl.classList.contains('hidden')) {
        return showToast("⚠️ Lengkapi Gambar, Nama, Harga, dan WA!", true);
    }

    const offers = getStorage(DB_OFFER);
    const sData = SELLERS[activeSellerId];

    offers.push({
        id: Date.now(), reqId: reqId, sellerId: activeSellerId, sellerName: sData.name,
        item: nameEl.value, price: priceEl.value, cond: condEl.value, phone: phoneEl.value,
        qty: parseInt(qtyEl.value || 1), vid: vidLinkEl.value, img: imgEl.src
    });

    localStorage.setItem('last_phone', phoneEl.value);

    try {
        saveStorage(DB_OFFER, offers);
        showToast("✅ Penawaran Terkirim!");
        renderSeller();
        renderBuyer();
    } catch(e) {
        alert("⚠️ Gagal: Memori Browser Penuh!");
    }
}

function getStorage(k) { return JSON.parse(localStorage.getItem(k) || '[]'); }
function saveStorage(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function resetData() { if(confirm("Yakin ingin mereset semuanya?")) { localStorage.clear(); location.reload(); } }
function getLastPhone() { return localStorage.getItem('last_phone') || ''; }
        
function showToast(msg, isError = false) {
    const t = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    icon.className = isError ? "fa-solid fa-triangle-exclamation text-rose-400" : "fa-solid fa-circle-check text-emerald-400";
    document.getElementById('toast-msg').innerText = msg;
    t.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 3000);
}

document.getElementById('buyer-input').addEventListener('keypress', (e) => { if(e.key === 'Enter') sendRequest(); });
document.getElementById('chat-input').addEventListener('keypress', (e) => { if(e.key === 'Enter') sendChatMessage(); });

let map;
let marker;

function initMap(){

    const mapEl = document.getElementById("map");
    if(!mapEl) return;

    map = L.map("map").setView([-6.200000,106.816666], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
    }).addTo(map);

    map.on("click", function(e){

        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        if(marker) map.removeLayer(marker);

        marker = L.marker([lat,lng]).addTo(map);

        document.getElementById("buyer-address").value =
            lat.toFixed(6) + ", " + lng.toFixed(6);
    });

}

async function searchAddress(){

    const address = document.getElementById("buyer-address").value;

    if(address.length < 3) return;

    const url =
    "https://nominatim.openstreetmap.org/search?format=json&q="
    + encodeURIComponent(address);

    const res = await fetch(url);
    const data = await res.json();

    if(!data || data.length === 0) return;

    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);

    map.setView([lat,lon],16);

    if(marker) map.removeLayer(marker);

    marker = L.marker([lat,lon]).addTo(map);
}