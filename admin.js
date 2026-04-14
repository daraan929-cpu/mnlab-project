const API_BASE = '';
let adminPassword = '';
let currentMaterials = [];

// Check if already logged in
document.addEventListener('DOMContentLoaded', () => {
    const savedPass = localStorage.getItem('mnlab_admin_pass');
    if (savedPass) {
        adminPassword = savedPass;
        document.getElementById('admin-pass').value = adminPassword;
        login();
    }
});

async function login() {
    adminPassword = document.getElementById('admin-pass').value;
    const errorMsg = document.getElementById('login-error');
    
    try {
        // Use a protected endpoint to properly validate the password
        const response = await fetch(`${API_BASE}/api/v1/admin/orders`, {
            headers: { 'X-Admin-Password': adminPassword }
        });

        if (response.status === 200) {
            localStorage.setItem('mnlab_admin_pass', adminPassword);
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'flex';
            loadSettings();
        } else if (response.status === 401) {
            errorMsg.textContent = 'الرمز غير صحيح';
            errorMsg.style.display = 'block';
            localStorage.removeItem('mnlab_admin_pass');
        } else {
            errorMsg.textContent = 'خطأ في قاعدة البيانات أو السيرفر (تحقق من MongoDB)';
            errorMsg.style.display = 'block';
        }
    } catch (err) {
        console.error(err);
        alert('حدث خطأ في الاتصال بالسيرفر. تأكد من تشغيل الـ Backend.');
    }
}

function logout() {
    localStorage.removeItem('mnlab_admin_pass');
    location.reload();
}

async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE}/api/v1/settings`);
        const settings = await response.json();

        // 1. General & Content
        document.getElementById('setting-phone').value = settings.content?.contact_phone || '';
        document.getElementById('setting-email').value = settings.content?.contact_email || '';
        document.getElementById('setting-hero-title').value = settings.content?.hero_title || '';
        document.getElementById('setting-hero-subtitle').value = settings.content?.hero_subtitle || '';
        document.getElementById('setting-gemini-key').value = settings.content?.gemini_api_key || '';

        // 2. Colors
        const colorsContainer = document.getElementById('colors-container');
        colorsContainer.innerHTML = '';
        
        for (const [key, value] of Object.entries(settings.colors)) {
            // Apply to Admin Panel too for preview
            document.documentElement.style.setProperty(key, value);
            
            if (value.startsWith('#')) {
                const item = document.createElement('div');
                item.className = 'color-picker-item';
                item.innerHTML = `
                    <span>${key.replace('--', '').replace('-', ' ')}</span>
                    <input type="color" value="${value}" data-var="${key}" onchange="updateColorPreview(this)">
                `;
                colorsContainer.appendChild(item);
            }
        }

        // 3. Images Previews
        if (settings.images.hero_image) {
            const heroPrev = document.getElementById('preview-hero');
            heroPrev.src = `/${settings.images.hero_image}`;
            heroPrev.style.display = 'block';
        }
        
        // Gallery Previews
        if (settings.images.gallery && Array.isArray(settings.images.gallery)) {
            settings.images.gallery.forEach((img, index) => {
                const prev = document.getElementById(`preview-gallery${index + 1}`);
                if (prev) {
                    prev.src = `/${img}`;
                    prev.style.display = 'block';
                }
            });
        }

        // 4. Materials
        currentMaterials = settings.materials || [];
        renderMaterials();

    } catch (err) {
        console.error('Error loading settings:', err);
    }
}

function showTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    el.classList.add('active');
    
    document.getElementById('tab-title').textContent = el.textContent.trim();

    if (tabId === 'orders') {
        loadOrders();
    }
}

function updateColorPreview(input) {
    // Real-time preview for the admin dashboard itself
    document.documentElement.style.setProperty(input.dataset.var, input.value);
}

async function handleUpload(target, input) {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', target);

    try {
        const response = await fetch(`${API_BASE}/api/v1/upload`, {
            method: 'POST',
            headers: { 'X-Admin-Password': adminPassword },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            const preview = document.getElementById(`preview-${target}`);
            if (preview) {
                preview.src = URL.createObjectURL(file);
                preview.style.display = 'block';
            }
            showStatus();
        } else {
            alert('فشل الرفع');
        }
    } catch (err) {
        console.error(err);
    }
}

async function saveAll() {
    const settings = {
        colors: {},
        content: {
            contact_phone: document.getElementById('setting-phone').value,
            contact_email: document.getElementById('setting-email').value,
            hero_title: document.getElementById('setting-hero-title').value,
            hero_subtitle: document.getElementById('setting-hero-subtitle').value,
            gemini_api_key: document.getElementById('setting-gemini-key').value
        }
    };

    document.querySelectorAll('#colors-container input[type="color"]').forEach(input => {
        settings.colors[input.dataset.var] = input.value;
    });

    settings.materials = currentMaterials;

    try {
        const response = await fetch(`${API_BASE}/api/v1/settings`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Admin-Password': adminPassword 
            },
            body: JSON.stringify(settings)
        });

        if (response.ok) {
            showStatus();
        } else {
            alert('فشل الحفظ');
        }
    } catch (err) {
        console.error(err);
    }
}


function showStatus() {
    const status = document.getElementById('save-status');
    status.style.display = 'inline';
    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
}
// --- Materials Management ---
function renderMaterials() {
    const container = document.getElementById('materials-container');
    if (!container) return;
    container.innerHTML = '';

    currentMaterials.forEach((mat, index) => {
        const item = document.createElement('div');
        item.className = 'upload-card';
        item.style.cursor = 'default';
        item.style.textAlign = 'right';
        item.innerHTML = `
            <div class="input-group">
                <label>اسم المادة</label>
                <input type="text" value="${mat.name}" onchange="updateMaterial(${index}, 'name', this.value)">
            </div>
            <div class="input-group">
                <label>وصف المادة</label>
                <textarea style="width:100%; height:60px; padding:10px; border-radius:8px; background:rgba(255,255,255,0.05); color:white; border:1px solid var(--glass-border);" onchange="updateMaterial(${index}, 'description', this.value)">${mat.description}</textarea>
            </div>
            <button class="btn" style="background: rgba(255,0,0,0.1); color:#ff4d4d; font-size:0.8rem; padding:5px 10px; width:auto;" onclick="removeMaterial(${index})">حذف</button>
        `;
        container.appendChild(item);
    });
}

window.addNewMaterial = function() {
    currentMaterials.push({ name: 'مادة جديدة', description: 'وصف هنا...' });
    renderMaterials();
};

window.updateMaterial = function(index, key, val) {
    currentMaterials[index][key] = val;
};

window.removeMaterial = function(index) {
    currentMaterials.splice(index, 1);
    renderMaterials();
};

// --- Orders Management ---
async function loadOrders() {
    const list = document.getElementById('orders-list');
    list.innerHTML = '<p>جاري تحميل الطلبات...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/api/v1/admin/orders`, {
            headers: { 'X-Admin-Password': adminPassword }
        });
        const orders = await response.json();
        
        if (orders.length === 0) {
            list.innerHTML = '<p style="color: grey;">لا توجد طلبات حالياً.</p>';
            return;
        }

        list.innerHTML = orders.reverse().map(order => `
            <div class="color-picker-item" style="flex-direction: column; align-items: flex-start; gap: 10px; background: rgba(255,255,255,0.05);">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <strong>Order ID: ${order.id}</strong>
                    <span style="color: var(--accent-1); font-size: 0.8rem;">${new Date(order.timestamp).toLocaleString()}</span>
                </div>
                <div style="font-size: 0.9rem;">
                    <p>العميل: ${order.customer_name || 'N/A'}</p>
                    <p>التفاصيل: ${order.details || 'N/A'}</p>
                    ${order.design_file ? `
                    <p style="margin-top: 5px;">
                        <strong>الملف المرفق:</strong> 
                        <a href="${API_BASE}/api/v1/order-file/${order.id}" target="_blank" style="color: var(--accent-1); text-decoration: underline;">
                           <i class="fas fa-download"></i> تحميل ملف التصميم
                        </a>
                    </p>` : '<p style="color: #666;">لا يوجد ملف مرفق</p>'}
                </div>
                <div style="display: flex; gap: 10px; width: 100%; margin-top: 5px;">
                    <select onchange="updateOrderStatus('${order.id}', this.value)" style="background: #1a1a2e; color: white; border: 1px solid var(--glass-border); padding: 5px; border-radius: 5px; flex: 1;">
                        <option value="قيد المراجعة" ${order.status === 'قيد المراجعة' ? 'selected' : ''}>قيد المراجعة</option>
                        <option value="قيد الطباعة" ${order.status === 'قيد الطباعة' ? 'selected' : ''}>قيد الطباعة</option>
                        <option value="جاهز للتسليم" ${order.status === 'جاهز للتسليم' ? 'selected' : ''}>جاهز للتسليم</option>
                        <option value="تم التسليم" ${order.status === 'تم التسليم' ? 'selected' : ''}>تم التسليم</option>
                        <option value="ملغي" ${order.status === 'ملغي' ? 'selected' : ''}>ملغي</option>
                    </select>
                </div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = '<p style="color: red;">فشل تحميل الطلبات.</p>';
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await fetch(`${API_BASE}/api/v1/admin/orders/update`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Admin-Password': adminPassword 
            },
            body: JSON.stringify({ id: orderId, status: newStatus })
        });
        showStatus();
    } catch (err) {
        alert('فشل تحديث الحالة');
    }
}
