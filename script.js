// ============================================================
// Configuração Supabase
// ============================================================
const SUPABASE_URL = 'https://vnyplgxevpqegvhykwlj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZueXBsZ3hldnBxZWd2aHlrd2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDI0NjYsImV4cCI6MjA4ODU3ODQ2Nn0.QYJz1arSBGHOrVtqyC769i2Srtj8qvRWtb4dRDohBXA';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// Estado e Armazenamento
// ============================================================

// Carregar produtos do Supabase
async function fetchProducts() {
    try {
        const { data, error } = await _supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        products = data || [];
        return products;
    } catch (err) {
        console.error('Erro ao carregar produtos:', err.message);
        return [];
    }
}

// Salvar produto no Supabase
async function saveProduct(product) {
    try {
        const { data, error } = await _supabase
            .from('products')
            .insert([product]);

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Erro ao salvar produto:', err.message);
        throw err;
    }
}

// Estado global
let products = [];
let cart = [];
let currentCategory = 'all';

// ============================================================
// Referências do DOM
// ============================================================

// Navegação
const navMenu = document.getElementById('navMenu');
const navAdmin = document.getElementById('navAdmin');
const menuView = document.getElementById('menuView');
const adminView = document.getElementById('adminView');

// Menu
const menuGrid = document.getElementById('menuGrid');
const categoryPills = document.querySelectorAll('.category-pill');
const searchInput = document.getElementById('searchInput');
const emptyMenuMsg = document.getElementById('emptyMenuMsg');

// Carrinho
const cartTrigger = document.getElementById('cartTrigger');
const cartOverlay = document.getElementById('cartOverlay');
const cartSidebar = document.getElementById('cartSidebar');
const closeCartBtn = document.getElementById('closeCart');
const cartItemsContainer = document.getElementById('cartItems');
const cartBadge = document.getElementById('cartBadge');
const cartTotalElement = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');

// Admin / Cadastro
const productForm = document.getElementById('productForm');
const imageUploadArea = document.getElementById('imageUploadArea');
const productImageInput = document.getElementById('productImage');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const imagePreview = document.getElementById('imagePreview');
const adminProductsList = document.getElementById('adminProductsList');

// ============================================================
// Utilitários
// ============================================================

const formatMoney = (amount) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

// Gerar ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ============================================================
// Navegação entre Views
// ============================================================

function switchView(view) {
    if (view === 'menu') {
        menuView.classList.add('active');
        adminView.classList.remove('active');
        navMenu.classList.add('active');
        navAdmin.classList.remove('active');
        refreshData();
    } else {
        adminView.classList.add('active');
        menuView.classList.remove('active');
        navAdmin.classList.add('active');
        navMenu.classList.remove('active');
        refreshData();
    }
}

navMenu.addEventListener('click', () => switchView('menu'));
navAdmin.addEventListener('click', () => switchView('admin'));

// ============================================================
// Renderizar Produtos no Menu
// ============================================================

function renderProducts(productsToRender) {
    menuGrid.innerHTML = '';

    if (products.length === 0) {
        menuGrid.style.display = 'none';
        emptyMenuMsg.style.display = 'block';
        return;
    }

    menuGrid.style.display = 'grid';
    emptyMenuMsg.style.display = 'none';

    if (productsToRender.length === 0) {
        menuGrid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 2rem;">Nenhum produto encontrado para essa busca.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const productCard = document.createElement('article');
        productCard.className = 'product-card';

        // Faixa de novidade
        const novidadeHtml = product.novidade
            ? '<div class="product-badge-novidade">Novidade</div>'
            : '';

        // Prefixo "A partir de"
        const startingPricePrefix = product.is_starting_price ? '<span class="price-prefix">A partir de </span>' : '';

        productCard.innerHTML = `
            <div class="product-image-wrapper">
                ${novidadeHtml}
                <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-header">
                    <h3 class="product-name">${product.name}</h3>
                    <span class="product-price">${startingPricePrefix}${formatMoney(product.price)}</span>
                </div>
                <p class="product-desc">${product.description}</p>
                <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                    <i class="ph ph-shopping-cart"></i> Adicionar
                </button>
            </div>
        `;
        menuGrid.appendChild(productCard);
    });
}

// Filtrar Produtos
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();

    const filtered = products.filter(product => {
        // Categoria especial: "novidades" filtra pelo campo novidade
        let matchCategory;
        if (currentCategory === 'all') {
            matchCategory = true;
        } else if (currentCategory === 'novidades') {
            matchCategory = product.novidade === true;
        } else {
            matchCategory = product.category === currentCategory;
        }

        const matchSearch = product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm);
        return matchCategory && matchSearch;
    });

    renderProducts(filtered);
}

// Event Listeners de Filtro
categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
        categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentCategory = pill.dataset.category;
        filterProducts();
    });
});

searchInput.addEventListener('input', filterProducts);

// ============================================================
// Carrinho de Compras
// ============================================================

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartUI();
    cartBadge.classList.add('pop');
    setTimeout(() => cartBadge.classList.remove('pop'), 300);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateQuantity(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartUI();
        }
    }
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    cartBadge.textContent = totalItems;
    cartTotalElement.textContent = formatMoney(totalPrice);
    checkoutBtn.disabled = cart.length === 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Seu carrinho está vazio.</div>';
        return;
    }

    cartItemsContainer.innerHTML = '';
    cart.forEach(item => {
        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item';
        cartItemEl.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
                <div>
                    <h4 class="cart-item-title">${item.name}</h4>
                    <span class="cart-item-price">${formatMoney(item.price)}</span>
                </div>
                <div class="cart-item-actions">
                    <div class="qty-control">
                        <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">
                            <i class="ph ph-minus"></i>
                        </button>
                        <span class="qty-val">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">
                            <i class="ph ph-plus"></i>
                        </button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(cartItemEl);
    });
}

// Toggle Carrinho
function toggleCart() {
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
}

cartTrigger.addEventListener('click', toggleCart);
closeCartBtn.addEventListener('click', toggleCart);
cartOverlay.addEventListener('click', toggleCart);

checkoutBtn.addEventListener('click', () => {
    if (cart.length > 0) {
        alert('Pedido finalizado com sucesso!');
        cart = [];
        updateCartUI();
        toggleCart();
    }
});

// ============================================================
// Admin - Cadastro de Produtos
// ============================================================

// Variável para guardar a imagem em base64
let currentImageBase64 = '';

// Clicar na área de upload abre o seletor de arquivo
imageUploadArea.addEventListener('click', () => {
    productImageInput.click();
});

// Drag & Drop na área de upload
imageUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadArea.style.borderColor = 'var(--accent-primary)';
});

imageUploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    imageUploadArea.style.borderColor = '';
});

imageUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    imageUploadArea.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageFile(file);
    }
});

// Quando o arquivo é selecionado
productImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImageFile(file);
    }
});

// Converter imagem para base64 e mostrar preview
function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImageBase64 = e.target.result;
        imagePreview.src = currentImageBase64;
        imagePreview.style.display = 'block';
        uploadPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// Submeter formulário
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDesc').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;
    const novidade = document.getElementById('productNovidade').checked;
    const is_starting_price = document.getElementById('productStartingPrice').checked;

    if (!name || !description || isNaN(price) || price <= 0) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    if (!currentImageBase64) {
        alert('Por favor, adicione uma foto do produto.');
        return;
    }

    const submitBtn = productForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ph ph-circle-notch animate-spin"></i> Enviando...';

    const newProduct = {
        name,
        description,
        price,
        category,
        image: currentImageBase64,
        novidade,
        is_starting_price
    };

    try {
        await saveProduct(newProduct);

        // Resetar formulário
        productForm.reset();
        currentImageBase64 = '';
        imagePreview.style.display = 'none';
        uploadPlaceholder.style.display = 'block';

        // Atualizar listas
        await refreshData();

        alert('Produto cadastrado com sucesso! ✅');
    } catch (err) {
        alert('Erro ao cadastrar produto. Verifique sua conexão.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="ph ph-plus-circle"></i> Cadastrar Produto';
    }
});

// Renderizar lista de produtos no Admin
function renderAdminList() {
    if (products.length === 0) {
        adminProductsList.innerHTML = '<div class="empty-admin-msg">Nenhum produto cadastrado ainda.</div>';
        return;
    }

    adminProductsList.innerHTML = '';
    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'admin-product-item';

        const novidadeTag = product.novidade
            ? '<span class="novidade-tag">Novidade</span>'
            : '';

        const startingTag = product.is_starting_price
            ? '<span class="starting-tag">A partir de</span>'
            : '';

        item.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="admin-product-img">
            <div class="admin-product-info">
                <div class="admin-product-name">${product.name}</div>
                <div class="admin-product-meta">
                    <span class="admin-product-price">${formatMoney(product.price)}</span>
                    ${novidadeTag}
                    ${startingTag}
                </div>
            </div>
            <button class="admin-delete-btn" onclick="deleteProduct('${product.id}')" title="Excluir produto">
                <i class="ph ph-trash"></i>
            </button>
        `;
        adminProductsList.appendChild(item);
    });
}

// Excluir produto
async function deleteProduct(productId) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
            const { error } = await _supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;
            await refreshData();
        } catch (err) {
            alert('Erro ao excluir produto.');
        }
    }
}

// Atualizar dados e interface
async function refreshData() {
    await fetchProducts();
    renderAdminList();
    filterProducts();
}

// ============================================================
// Inicialização
// ============================================================

async function init() {
    await fetchProducts();
    filterProducts();
    updateCartUI();
}

init();
