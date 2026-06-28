const pusher = new Pusher('4dd0c976a6cd91940ec6', { cluster: 'ap2' });
const channel = pusher.subscribe('alpha-one');

const app = {
  currentUser: null,
  async fetchApi(endpoint, method = 'GET', body = null) {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) options.body = JSON.stringify(body);
      const res = await fetch('/api' + endpoint, options);
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },
  cache: {
    sizes: [],
    cities: [],
    parties: [],
    grParties: [],
    stock: [],
    bills: []
  },

  init() {
    try {
      this.cacheElements();
      this.bindEvents();
      this.setupSocketListeners();
      
      const savedUser = localStorage.getItem('alphaOneUser');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
        this.handleLoginSuccess();
      }
    } catch (err) {
      console.error('Initialization error:', err);
      alert('Initialization error: ' + err.message);
    } finally {
      // Simulate initial loading
      setTimeout(() => this.hideLoader(), 1000);
    }
  },

  cacheElements() {
    this.screens = document.querySelectorAll('.screen');
    this.pages = document.querySelectorAll('.page');
    this.navLinks = document.querySelectorAll('.nav-link');
    
    // Login
    this.loginForm = document.getElementById('login-form');
    this.loginId = document.getElementById('login-id');
    this.loginPassword = document.getElementById('login-password');
    this.logoutBtn = document.getElementById('logout-btn');
    
    // Elements for different sections
    // Users
    this.userForm = document.getElementById('user-form');
    
    // Size Set
    this.sizeForm = document.getElementById('size-form');
    
    // City
    this.cityForm = document.getElementById('city-form');
    
    // Party
    this.partyForm = document.getElementById('party-form');
    this.grPartyForm = document.getElementById('gr-party-form');
    
    // Stock
    this.stockForm = document.getElementById('stock-form');
    this.grStockForm = document.getElementById('gr-stock-form');
    
    // Bill
    this.billForm = document.getElementById('bill-form');
    this.addDesignBtn = document.getElementById('add-design-btn');
    this.billItemsContainer = document.getElementById('bill-items-container');
    
    // Payment
    this.paymentForm = document.getElementById('payment-form');
  },

  bindEvents() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    const toggleSidebar = () => {
      sidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('active');
    };
    const closeSidebar = () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    };

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    // Navigation
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.getAttribute('href').substring(1);
        this.navigate(target);
        if (window.innerWidth <= 768) closeSidebar();
      });
    });

    // Login
    this.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.showLoader();
      this.fetchApi('/login', 'POST', {
        id: this.loginId.value,
        password: this.loginPassword.value
      }).then(res => {
        this.hideLoader();
        if (res.success) {
          this.currentUser = res.user;
          localStorage.setItem('alphaOneUser', JSON.stringify(res.user));
          this.handleLoginSuccess();
        } else {
          alert('Login failed: ' + res.message);
        }
      });
    });

    // Logout
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => {
        this.fetchApi('/logout', 'POST');
        localStorage.removeItem('alphaOneUser');
        this.handleLogout();
      });
    }

    // --- FORM SUBMISSIONS ---
    // Users
    if (this.userForm) {
      this.userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.showLoader();
        this.fetchApi('/users', 'POST', {
          id: document.getElementById('new-user-id').value,
          password: document.getElementById('new-user-password').value,
          role: document.getElementById('new-user-role').value
        }).then(res => {
          this.hideLoader();
          if(res.success) {
            this.userForm.reset();
            alert('User created successfully');
          } else {
            alert('Error: ' + res.message);
          }
        });
      });
    }

    // Size Set
    if (this.sizeForm) {
      this.sizeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.showLoader();
        this.fetchApi('/sizesets', 'POST', {
          name: document.getElementById('size-name').value,
          piecesPerSet: document.getElementById('size-pieces').value
        }).then(res => {
          this.hideLoader();
          if (res.success) this.sizeForm.reset();
        });
      });
    }

    // City
    if (this.cityForm) {
      this.cityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.showLoader();
        this.fetchApi('/cities', 'POST', {
          name: document.getElementById('city-name').value
        }).then(res => {
          this.hideLoader();
          if (res.success) this.cityForm.reset();
        });
      });
    }

    // Party
    if (this.partyForm) {
      this.partyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.showLoader();
        this.fetchApi('/parties', 'POST', {
          name: document.getElementById('party-name').value,
          city: document.getElementById('party-city').value,
          address: document.getElementById('party-address').value,
          type: 'Normal'
        }).then(res => {
          this.hideLoader();
          if (res.success) this.partyForm.reset();
        });
      });
    }

    // GR Party
    if (this.grPartyForm) {
      this.grPartyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.showLoader();
        this.fetchApi('/parties', 'POST', {
          name: document.getElementById('gr-party-name').value,
          city: document.getElementById('gr-party-city').value,
          address: document.getElementById('gr-party-address').value,
          type: 'GR'
        }).then(res => {
          this.hideLoader();
          if (res.success) this.grPartyForm.reset();
        });
      });
    }

    // Stock
    this.bindStockEvents();

    // Bill
    this.bindBillEvents();
    
    // Payment
    if (this.paymentForm) {
      this.paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const partyId = document.getElementById('payment-party').value;
        if (!partyId) {
          alert('Please select a valid party from the dropdown.');
          return;
        }
        
        this.showLoader();
        this.fetchApi('/payments', 'POST', {
          party: partyId,
          amount: document.getElementById('payment-amount').value,
          method: document.getElementById('payment-method').value
        }).then(res => {
          this.hideLoader();
          if (res.success) {
            this.paymentForm.reset();
            document.getElementById('payment-party').value = '';
            document.getElementById('payment-party-search').value = '';
            document.getElementById('payment-party-balance-display').innerText = '';
            alert('Payment saved successfully');
          } else {
            alert('Error: ' + res.message);
          }
        });
      });
    }

    // GR Return
    this.bindGRReturnEvents();
  },

  bindGRReturnEvents() {
    const addBtn = document.getElementById('gr-return-add-design-btn');
    const container = document.getElementById('gr-return-items-container');
    const form = document.getElementById('gr-return-form');

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'bill-item-row';
        row.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr auto; gap: 10px; align-items: center; margin-bottom: 10px;';
        row.innerHTML = `
          <select class="item-design gr-return-design" required><option value="">Select Design</option></select>
          <input type="number" class="item-pieces" placeholder="Pieces" required>
          <button type="button" class="danger-btn" onclick="this.parentElement.remove()">X</button>
        `;
        container.appendChild(row);
        this.updateDesignDropdowns(row.querySelector('.gr-return-design'));
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const partyId = document.getElementById('gr-return-party').value;
        if (!partyId) return alert('Select a valid party from the search list.');

        const rows = document.querySelectorAll('#gr-return-items-container .bill-item-row');
        if (rows.length === 0) return alert('Add at least one design');

        const items = [];
        for (let row of rows) {
          const dSel = row.querySelector('.gr-return-design');
          const pInp = row.querySelector('.item-pieces');
          if (!dSel.value || !pInp.value) return alert('Fill all item details');
          items.push({ stock: dSel.value, pieces: Number(pInp.value) });
        }

        this.showLoader();
        this.fetchApi('/goods-return', 'POST', { party: partyId, items }).then(res => {
          this.hideLoader();
          if (res.success) {
            alert('Goods Return successfully recorded. Amount Rs. ' + res.totalAmount + ' deducted from party balance.');
            form.reset();
            document.getElementById('gr-return-party').value = '';
            document.getElementById('gr-return-party-search').value = '';
            // Reset to 1 row
            container.innerHTML = `
              <div class="bill-item-row" style="display: grid; grid-template-columns: 2fr 1fr auto; gap: 10px; align-items: center; margin-bottom: 10px;">
                <select class="item-design gr-return-design" required><option value="">Select Design</option></select>
                <input type="number" class="item-pieces" placeholder="Pieces" required>
              </div>
            `;
            this.updateDesignDropdowns();
          } else {
            alert('Error: ' + res.message);
          }
        });
      });
    }
  },

  bindStockEvents() {
    const calcStock = (qId, uId, sId, resId) => {
      const q = Number(document.getElementById(qId).value) || 0;
      const u = document.getElementById(uId)?.value || 'pieces';
      const sizeSetId = document.getElementById(sId).value;
      const resEl = document.getElementById(resId);
      
      if (!sizeSetId || q === 0) {
        resEl.innerText = 'Live Calculation: 0 Sets / 0 Dozens / 0 Remaining Pieces';
        return;
      }
      
      const setInfo = this.cache.sizes.find(s => s._id === sizeSetId);
      if (!setInfo) return;
      
      let totalPieces = 0;
      if (u === 'pieces') totalPieces = q;
      else if (u === 'dozens') totalPieces = q * 12;
      
      const sets = Math.floor(totalPieces / setInfo.piecesPerSet);
      const dozens = Math.floor(totalPieces / 12);
      const remaining = totalPieces % 12;
      resEl.innerText = `Live Calculation: ${sets} Sets / ${dozens} Dozens / ${totalPieces} Total Pcs / ${remaining} Remaining Pcs`;
    };

    ['stock-quantity', 'stock-unit', 'stock-size-set'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => calcStock('stock-quantity', 'stock-unit', 'stock-size-set', 'stock-live-calc'));
    });
    
    ['gr-stock-quantity', 'gr-stock-size-set'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => calcStock('gr-stock-quantity', null, 'gr-stock-size-set', 'gr-stock-live-calc'));
    });

    this.stockForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.showLoader();
      
      const q = Number(document.getElementById('stock-quantity').value);
      const u = document.getElementById('stock-unit').value;
      let totalPieces = u === 'dozens' ? q * 12 : q;

      this.fetchApi('/stock', 'POST', {
        designNo: document.getElementById('stock-design-no').value,
        designName: document.getElementById('stock-design-name').value,
        sizeSet: document.getElementById('stock-size-set').value,
        perPiecePrice: document.getElementById('stock-price').value,
        pieces: totalPieces,
        isGR: false
      }).then(res => {
        this.hideLoader();
        if (res.success) {
          this.stockForm.reset();
          document.getElementById('stock-live-calc').innerText = 'Live Calculation: 0 Sets / 0 Dozens / 0 Remaining Pieces';
        } else {
          alert(res.message);
        }
      });
    });

    this.grStockForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.showLoader();
      this.fetchApi('/stock', 'POST', {
        designNo: document.getElementById('gr-stock-design-no').value,
        designName: document.getElementById('gr-stock-design-name').value,
        sizeSet: document.getElementById('gr-stock-size-set').value,
        perPiecePrice: document.getElementById('gr-stock-price').value,
        pieces: Number(document.getElementById('gr-stock-quantity').value),
        isGR: true
      }).then(res => {
        this.hideLoader();
        if (res.success) {
          this.grStockForm.reset();
          document.getElementById('gr-stock-live-calc').innerText = 'Live Calculation: 0 Sets / 0 Dozens / 0 Remaining Pieces';
        } else alert(res.message);
      });
    });
  },

  bindBillEvents() {
    // Party Live Search
    this.setupAutocomplete(
      'bill-party-search', 'bill-party', 'bill-party-dropdown', 'selected-party-display',
      () => this.cache.parties.map(p => ({
        value: p._id,
        searchText: `${p.name} ${p.city.name} ${p.address || ''}`,
        displayText: `${p.name} - ${p.city.name}${p.address ? ' - '+p.address : ''}`
      }))
    );

    // Default Row when opening page (handled in navigation or here as init)
    // Dynamic Rows
    this.addDesignBtn.addEventListener('click', () => {
      const rowId = 'row-' + Date.now();
      const searchId = rowId + '-search';
      const hiddenId = rowId + '-hidden';
      const dropdownId = rowId + '-dropdown';

      const rowHtml = `
        <div class="bill-item-row" id="${rowId}">
          <div class="design-select-group" style="position:relative; flex:1;">
            <input type="text" id="${searchId}" class="item-design-search" placeholder="Search Design (No/Name)..." autocomplete="off" required>
            <input type="hidden" id="${hiddenId}" class="item-design" required>
            <ul id="${dropdownId}" class="autocomplete-list"></ul>
          </div>
          <input type="number" class="item-pieces" placeholder="Qty (Pieces)" required>
          <div class="row-live-calc">Price: Rs.0 | 0 Sets / 0 Dozens</div>
          <button type="button" class="danger-btn" onclick="document.getElementById('${rowId}').remove()">X</button>
        </div>
      `;
      this.billItemsContainer.insertAdjacentHTML('beforeend', rowHtml);

      const newRow = document.getElementById(rowId);
      const pieceInput = newRow.querySelector('.item-pieces');
      const calcDisplay = newRow.querySelector('.row-live-calc');
      const hiddenInput = document.getElementById(hiddenId);

      const updateRowCalc = () => {
        if(!hiddenInput.value || !pieceInput.value) {
          calcDisplay.innerText = "Price: Rs.0 | 0 Sets / 0 Dozens";
          return;
        }
        const price = Number(hiddenInput.dataset.price);
        const piecesPerSet = Number(hiddenInput.dataset.sets);
        const qty = Number(pieceInput.value);
        
        const sets = Math.floor(qty / piecesPerSet);
        const dozens = Math.floor(qty / 12);
        const remaining = qty % 12;
        calcDisplay.innerText = `Price: Rs.${price} | Total: Rs.${price * qty} | ${sets} Sets / ${dozens} Dozens / ${qty} Total Pcs / ${remaining} Remaining Pcs`;
      };

      this.setupAutocomplete(
        searchId, hiddenId, dropdownId, null,
        () => this.cache.stock.filter(s => !s.isGR).map(s => ({
          value: s._id,
          searchText: `${s.designNo} ${s.designName}`,
          displayText: `${s.designNo} - ${s.designName} (Rs.${s.perPiecePrice})`,
          dataset: { price: s.perPiecePrice, sets: s.sizeSet.piecesPerSet }
        })),
        updateRowCalc
      );

      pieceInput.addEventListener('input', updateRowCalc);
    });

    // Save Only
    document.getElementById('btn-save-only').addEventListener('click', () => this.submitBill('Saved'));
    // Save & Print
    document.getElementById('btn-save-print').addEventListener('click', () => this.submitBill('Printed'));
  },

  submitBill(status) {
    const partyId = document.getElementById('bill-party').value;
    if (!partyId) { alert('Select a party first'); return; }

    const rows = document.querySelectorAll('#bill-items-container .bill-item-row');
    if (rows.length === 0) { alert('Add at least one design'); return; }

    const items = [];
    let grossTotal = 0;

    for(let row of rows) {
      const dSel = row.querySelector('.item-design');
      const pInp = row.querySelector('.item-pieces');
      if(!dSel.value || !pInp.value) { alert('Fill all item details'); return; }
      
      const price = Number(dSel.dataset.price);
      const pieces = Number(pInp.value);
      
      items.push({ stock: dSel.value, pieces, perPiecePrice: price });
      grossTotal += (price * pieces);
    }

    const discountPercent = Number(document.getElementById('bill-discount').value) || 0;
    const discountAmount = grossTotal * (discountPercent / 100);
    const netTotal = grossTotal - discountAmount;

    this.showLoader();
    this.fetchApi('/bills', 'POST', {
      party: partyId,
      items,
      discountPercent,
      grossTotal,
      discountAmount,
      netTotal,
      status,
      isGR: false
    }).then(res => {
      this.hideLoader();
      if (res.success) {
        alert(`Bill Generated Successfully! Net Total: Rs.${netTotal}`);
        document.getElementById('bill-party').value = '';
        document.getElementById('selected-party-display').innerText = 'Select a party...';
        this.billItemsContainer.innerHTML = '';
        this.billForm.reset();
        
        if (status === 'Printed') {
          // Find the bill to print from next socket update or just trigger generic print
          // For a SPA, we could rely on the next 'bills_updated' event to find the top one and print it
          // Let's navigate to bills list and they can print from there, or we can trigger it immediately
          setTimeout(() => {
            if(this.cache.bills.length > 0) {
              this.printBill(this.cache.bills[0]);
            }
          }, 1000);
        }
      } else {
        alert('Error generating bill: ' + res.message);
      }
    });
  },

  setupSocketListeners() {
    channel.bind('force_logout', () => {
      alert('Your session has been terminated by the Owner.');
      localStorage.removeItem('alphaOneUser');
      this.handleLogout();
    });

    channel.bind('users_updated', () => {
      this.fetchApi('/users').then(res => { if(res.success) this.renderUsers(res.users); });
    });
    channel.bind('sizesets_updated', () => {
      this.fetchApi('/sizesets').then(res => {
        if(res.success) {
          this.cache.sizes = res.sizes;
          this.renderSizes(res.sizes);
          this.updateSizeDropdowns();
        }
      });
    });
    channel.bind('cities_updated', () => {
      this.fetchApi('/cities').then(res => {
        if(res.success) {
          this.cache.cities = res.cities;
          this.renderCities(res.cities);
          this.updateCityDropdowns();
        }
      });
    });
    channel.bind('parties_updated', () => {
      this.fetchApi('/parties').then(res => {
        if(res.success) {
          this.cache.parties = res.parties.filter(p => p.type === 'Normal');
          this.cache.grParties = res.parties.filter(p => p.type === 'GR');
          this.renderParties();
          this.updatePartyDropdowns();
        }
      });
    });
    channel.bind('stock_updated', () => {
      this.fetchApi('/stock').then(res => {
        if(res.success) {
          this.cache.stock = res.stock;
          this.renderStock();
          this.refreshLedgerIfOpen();
        }
      });
    });
    channel.bind('bills_updated', () => {
      this.fetchApi('/bills').then(res => {
        if(res.success) {
          this.cache.bills = res.bills;
          this.renderBills(res.bills);
          this.refreshLedgerIfOpen();
          
          const pending = res.bills.filter(b => b.status === 'Saved').length;
          const counter = document.getElementById('pending-bills-counter');
          if (counter) counter.innerText = pending;
        }
      });
    });
    channel.bind('payments_updated', () => {
      this.fetchApi('/payments').then(res => {
        if(res.success) {
          this.renderPayments(res.payments);
          this.refreshLedgerIfOpen();
        }
      });
    });
  },

  refreshLedgerIfOpen() {
    const partyId = document.getElementById('ledger-party')?.value;
    const isLedgerVisible = !document.getElementById('party-ledger').classList.contains('hidden');
    if (isLedgerVisible && partyId) {
      this.loadPartyLedger(partyId);
    }
  },

  handleLoginSuccess() {
    document.getElementById('login-section').classList.remove('active');
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    
    document.getElementById('user-role-display').innerText = `Role: ${this.currentUser.role}`;

    // Role Based UI
    if (this.currentUser.role !== 'Owner') {
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    } else {
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }

    // Fetch initial data
    this.showLoader();
    this.fetchApi('/users').then(res => { if(res.success) this.renderUsers(res.users); });
    this.fetchApi('/sizesets').then(res => { if(res.success) { this.cache.sizes = res.sizes; this.renderSizes(res.sizes); this.updateSizeDropdowns(); } });
    this.fetchApi('/cities').then(res => { if(res.success) { this.cache.cities = res.cities; this.renderCities(res.cities); this.updateCityDropdowns(); } });
    this.fetchApi('/parties').then(res => { 
      if(res.success) { 
        this.cache.parties = res.parties.filter(p => p.type === 'Normal');
        this.cache.grParties = res.parties.filter(p => p.type === 'GR');
        this.renderParties(); 
        this.updatePartyDropdowns(); 
      } 
    });
    this.fetchApi('/stock').then(res => { if(res.success) { this.cache.stock = res.stock; this.renderStock(); } });
    this.fetchApi('/bills').then(res => { 
      if(res.success) { 
        this.cache.bills = res.bills; 
        this.renderBills(res.bills); 
        const pending = res.bills.filter(b => b.status === 'Saved').length;
        const counter = document.getElementById('pending-bills-counter');
        if (counter) counter.innerText = pending;
      } 
    });
    this.fetchApi('/payments').then(res => { if(res.success) this.renderPayments(res.payments); });
    
    // Initialize GR Billing
    this.initGRBilling();

    setTimeout(() => {
      this.hideLoader();
      const lastPage = localStorage.getItem('currentPage') || 'dashboard';
      this.navigate(lastPage);
    }, 1000);
  },

  handleLogout() {
    this.currentUser = null;
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('login-section').classList.add('active');
  },

  navigate(pageId) {
    this.pages.forEach(p => p.classList.add('hidden'));
    this.pages.forEach(p => p.classList.remove('active'));
    this.navLinks.forEach(l => l.classList.remove('active'));

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.classList.remove('hidden');
      targetPage.classList.add('active');
    }

    const targetLink = document.querySelector(`.nav-link[href="#${pageId}"]`);
    if (targetLink) targetLink.classList.add('active');
    
    localStorage.setItem('currentPage', pageId);
  },

  showLoader() {
    document.getElementById('loading-screen').classList.add('active');
  },
  
  hideLoader() {
    document.getElementById('loading-screen').classList.remove('active');
  },

  // --- RENDERING FUNCTIONS ---
  renderUsers(users) {
    const tbody = document.querySelector('#users-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    users.forEach(u => {
      tbody.innerHTML += `
        <tr>
          <td>${u.id}</td>
          <td>${u.role}</td>
          <td>
            ${this.currentUser.role === 'Owner' && u.id !== this.currentUser.id ? 
              `<button class="danger-btn" onclick="app.deleteUser('${u._id}')">Delete</button>` : '-'}
          </td>
        </tr>
      `;
    });
  },

  deleteUser(id) {
    if(confirm('Are you sure you want to delete this user? Their session will be terminated instantly.')) {
      this.showLoader();
      this.fetchApi('/users/' + id, 'DELETE').then(res => {
        this.hideLoader();
        if(!res.success) alert(res.message);
      });
    }
  },

  renderSizes(sizes) {
    const tbody = document.querySelector('#sizes-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const canEdit = this.currentUser && this.currentUser.role !== 'Operator';
    sizes.forEach(s => {
      let actions = '-';
      if(canEdit) {
        actions = `<button class="secondary-btn" style="padding: 6px 12px; font-size: 12px;" onclick="app.openEdit('sizeset', '${s._id}')">Edit</button> 
                   <button class="danger-btn" style="padding: 6px 12px; font-size: 12px;" onclick="app.deleteEntry('sizeset', '${s._id}')">Delete</button>`;
      }
      tbody.innerHTML += `<tr><td>${s.name}</td><td>${s.piecesPerSet}</td><td>${actions}</td></tr>`;
    });
  },

  updateSizeDropdowns() {
    const dds = ['stock-size-set', 'gr-stock-size-set'];
    dds.forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;
      el.innerHTML = '<option value="">Select Size Set</option>';
      this.cache.sizes.forEach(s => {
        el.innerHTML += `<option value="${s._id}">${s.name}</option>`;
      });
    });
  },

  renderCities(cities) {
    const tbody = document.querySelector('#cities-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const canEdit = this.currentUser && this.currentUser.role !== 'Operator';
    cities.forEach(c => {
      let actions = '-';
      if(canEdit) {
        actions = `<button class="secondary-btn" style="padding: 6px 12px; font-size: 12px;" onclick="app.openEdit('city', '${c._id}')">Edit</button> 
                   <button class="danger-btn" style="padding: 6px 12px; font-size: 12px;" onclick="app.deleteEntry('city', '${c._id}')">Delete</button>`;
      }
      tbody.innerHTML += `<tr><td>${c.name}</td><td>${actions}</td></tr>`;
    });
  },

  updateCityDropdowns() {
    const dds = ['party-city', 'gr-party-city'];
    dds.forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;
      el.innerHTML = '<option value="">Select City</option>';
      this.cache.cities.forEach(c => {
        el.innerHTML += `<option value="${c._id}">${c.name}</option>`;
      });
    });
  },

  renderParties() {
    const tNormal = document.querySelector('#parties-table tbody');
    const tGR = document.querySelector('#gr-parties-table tbody');
    const canEdit = this.currentUser && this.currentUser.role !== 'Operator';
    
    if (tNormal) {
      tNormal.innerHTML = '';
      this.cache.parties.forEach(p => {
        let actions = '-';
        if(canEdit) actions = `<button class="secondary-btn" style="padding: 6px 12px; font-size: 12px;" onclick="app.openEdit('party', '${p._id}')">Edit</button> <button class="danger-btn" style="padding: 6px 12px; font-size: 12px;" onclick="app.deleteEntry('party', '${p._id}')">Delete</button>`;
        tNormal.innerHTML += `<tr><td>${p.name}</td><td>${p.city?.name}</td><td>${p.address || '-'}</td><td>${actions}</td></tr>`;
      });
    }
    
    if (tGR) {
      tGR.innerHTML = '';
      this.cache.grParties.forEach(p => {
        let actions = '-';
        if(canEdit) actions = `<button class="secondary-btn" style="padding: 6px 12px; font-size: 12px;" onclick="app.openEdit('party', '${p._id}')">Edit</button> <button class="danger-btn" style="padding: 6px 12px; font-size: 12px;" onclick="app.deleteEntry('party', '${p._id}')">Delete</button>`;
        tGR.innerHTML += `<tr><td>${p.name}</td><td>${p.city?.name}</td><td>${p.address || '-'}</td><td>${actions}</td></tr>`;
      });
    }
  },

  updatePartyDropdowns() {
    const partyListSource = () => this.cache.parties.map(p => ({
      value: p._id,
      searchText: `${p.name} ${p.city?.name || ''} ${p.address || ''}`,
      displayText: `${p.name} - ${p.city?.name || ''}`
    }));

    // Payment Party Dropdown
    this.setupAutocomplete(
      'payment-party-search', 'payment-party', 'payment-party-dropdown', null,
      partyListSource,
      (item) => {
        if(item) {
          this.fetchApi('/balances').then(res => {
            if (res.success) {
              const bInfo = res.balances.find(b => b.partyId === item.value);
              const bal = bInfo ? bInfo.balance : 0;
              document.getElementById('payment-party-balance-display').innerText = `Remaining Balance: Rs. ${bal}`;
            }
          });
        } else {
          document.getElementById('payment-party-balance-display').innerText = '';
        }
      }
    );

    // GR Return Party Dropdown
    this.setupAutocomplete('gr-return-party-search', 'gr-return-party', 'gr-return-party-dropdown', null, partyListSource);

    // Ledger Party Dropdown
    this.setupAutocomplete(
      'ledger-party-search', 'ledger-party', 'ledger-party-dropdown', null,
      partyListSource,
      (item) => {
        if (item) {
          this.loadPartyLedger(item.value);
          document.getElementById('ledger-clear-btn').style.display = 'block';
        } else {
          document.getElementById('ledger-content').classList.add('hidden');
          document.getElementById('ledger-clear-btn').style.display = 'none';
        }
      }
    );
  },

  clearLedger() {
    document.getElementById('ledger-party-search').value = '';
    document.getElementById('ledger-party').value = '';
    document.getElementById('ledger-content').classList.add('hidden');
    document.getElementById('ledger-clear-btn').style.display = 'none';
  },

  loadPartyLedger(partyId) {
    this.showLoader();
    this.fetchApi('/party-ledger/' + partyId).then(res => {
      this.hideLoader();
      if (res.success) {
        document.getElementById('ledger-party-name').innerText = `Ledger for ${res.party.name} (${res.party.city?.name || 'No City'})`;
        const tbody = document.querySelector('#ledger-table tbody');
        tbody.innerHTML = '';
        res.ledger.forEach(row => {
          const date = new Date(row.date).toLocaleDateString();
          tbody.innerHTML += `
            <tr>
              <td>${date}</td>
              <td>${row.type}</td>
              <td>${row.ref}</td>
              <td>${row.details}</td>
              <td style="color: #dc3545;">Rs. ${row.debit > 0 ? row.debit : '-'}</td>
              <td style="color: #10b981;">Rs. ${row.credit > 0 ? row.credit : '-'}</td>
              <td style="font-weight: bold;">Rs. ${row.balance}</td>
            </tr>
          `;
        });
        document.getElementById('ledger-content').classList.remove('hidden');
        this.cache.currentLedgerHtml = tbody.innerHTML; // for printing
        this.cache.currentLedgerParty = res.party;
      } else {
        alert('Error loading ledger: ' + res.message);
      }
    });
  },

  printLedger() {
    const pv = document.getElementById('print-view');
    const party = this.cache.currentLedgerParty;
    const tbodyHtml = this.cache.currentLedgerHtml;
    
    if (!party || !tbodyHtml) return;

    pv.innerHTML = `
      <style>
        @media print {
          @page { size: A4; margin: 15mm; }
        }
      </style>
      <div class="print-header">
        <h1>Alpha One Garments</h1>
        <p>Party Summary / Ledger</p>
      </div>
      <div class="print-meta" style="margin-bottom: 30px;">
        <div>
          <p><strong>Party:</strong> ${party.name}</p>
          <p><strong>City:</strong> ${party.city?.name || ''}</p>
          ${party.address ? `<p><strong>Address:</strong> ${party.address}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>
      <table class="print-table">
        <thead>
          <tr>
            <th>DATE</th>
            <th>TYPE</th>
            <th>REF</th>
            <th>DETAILS</th>
            <th>DEBIT</th>
            <th>CREDIT</th>
            <th>RUNNING BAL</th>
          </tr>
        </thead>
        <tbody>
          ${tbodyHtml}
        </tbody>
      </table>
    `;

    setTimeout(() => {
      window.print();
    }, 200);
  },

  renderStock() {
    const tNormal = document.querySelector('#stock-table tbody');
    const tGR = document.querySelector('#gr-stock-table tbody');
    const canEdit = this.currentUser && this.currentUser.role !== 'Operator';
    
    if (tNormal) {
      tNormal.innerHTML = '';
      this.cache.stock.filter(s => !s.isGR).forEach(s => {
        let actions = '-';
        if(canEdit) actions = `<button class="secondary-btn" style="padding: 6px 12px; font-size: 12px;" onclick="app.openEdit('stock', '${s._id}')">Edit</button> <button class="danger-btn" style="padding: 6px 12px; font-size: 12px;" onclick="app.deleteEntry('stock', '${s._id}')">Delete</button>`;
        tNormal.innerHTML += `<tr><td>${s.designNo}</td><td>${s.designName}</td><td>${s.sizeSet?.name}</td><td>${s.pieces} Pcs</td><td>Rs.${s.perPiecePrice}</td><td>${actions}</td></tr>`;
      });
    }
    
    if (tGR) {
      tGR.innerHTML = '';
      this.cache.stock.filter(s => s.isGR).forEach(s => {
        let actions = '-';
        if(canEdit) actions = `<button class="secondary-btn" style="padding: 6px 12px; font-size: 12px;" onclick="app.openEdit('stock', '${s._id}')">Edit</button> <button class="danger-btn" style="padding: 6px 12px; font-size: 12px;" onclick="app.deleteEntry('stock', '${s._id}')">Delete</button>`;
        tGR.innerHTML += `<tr><td>${s.designNo}</td><td>${s.designName}</td><td>${s.sizeSet?.name}</td><td>${s.pieces} Pcs</td><td>Rs.${s.perPiecePrice}</td><td>${actions}</td></tr>`;
      });
    }

    this.updateDesignDropdowns();
  },

  updateDesignDropdowns(specificSelect = null) {
    if (!this.cache.stock) return;
    
    // Sort stock alphabetically or numerically by design number for better UX
    const sortedStock = [...this.cache.stock].sort((a, b) => a.designNo.localeCompare(b.designNo));
    
    const optionsHtml = '<option value="">Select Design</option>' + 
      sortedStock.map(s => `<option value="${s._id}">${s.designNo} - ${s.designName}</option>`).join('');
    
    if (specificSelect) {
      specificSelect.innerHTML = optionsHtml;
    } else {
      document.querySelectorAll('.gr-return-design').forEach(sel => {
        // preserve the current value if possible
        const currentVal = sel.value;
        sel.innerHTML = optionsHtml;
        if (currentVal) sel.value = currentVal;
      });
    }
  },

  renderBills(bills) {
    const tbody = document.querySelector('#bills-table tbody');
    const dbTbody = document.querySelector('#dashboard-pending-bills-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (dbTbody) dbTbody.innerHTML = '';
    
    // Apply filters if any (Basic implementation)
    const sBillNo = document.getElementById('search-bill-no')?.value;
    const filteredBills = bills.filter(b => {
      if(sBillNo && b.billNo !== Number(sBillNo)) return false;
      return true;
    });

    filteredBills.forEach(b => {
      const date = new Date(b.createdAt).toLocaleDateString();
      const party = b.party ? `${b.party.name} (${b.party.city?.name})` : 'Deleted Party';
      
      const rowHtml = `
        <tr>
          <td>${b.billNo}</td>
          <td>${date}</td>
          <td>${party}</td>
          <td>Rs.${b.netTotal}</td>
          <td><span style="color: ${b.status === 'Printed' ? '#10B981' : '#F59E0B'}">${b.status}</span></td>
          <td>
            <button class="secondary-btn" onclick="app.viewBill('${b._id}')">View</button>
            <button onclick="app.printBillId('${b._id}')">Re-Print</button>
            <button class="danger-btn" onclick="app.deleteBill('${b._id}')" style="background: var(--danger); margin-left: 5px;">Delete</button>
          </td>
        </tr>
      `;
      tbody.innerHTML += rowHtml;

      if (b.status === 'Saved' && dbTbody) {
        dbTbody.innerHTML += rowHtml;
      }
    });
  },

  renderPayments(payments) {
    const tbody = document.querySelector('#payments-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    payments.forEach(p => {
      const date = new Date(p.createdAt).toLocaleDateString();
      const party = p.party ? p.party.name : 'Unknown';
      tbody.innerHTML += `
        <tr>
          <td>${date}</td>
          <td>${party}</td>
          <td>Rs.${p.amount}</td>
          <td>${p.method}</td>
          <td>
            <button class="danger-btn" onclick="app.deletePayment('${p._id}')" style="background: var(--danger); padding: 5px 10px;">Delete</button>
          </td>
        </tr>
      `;
    });
  },

  deletePayment(id) {
    if (!confirm('Are you sure you want to delete this payment? It will be removed from the party ledger and balances.')) return;
    this.showLoader();
    this.fetchApi('/payments/' + id, 'DELETE').then(res => {
      this.hideLoader();
      if (res.success) {
        alert('Payment deleted successfully.');
      } else {
        alert('Failed to delete payment: ' + res.message);
      }
    });
  },

  // --- VIEW & PRINT BILL ---
  deleteBill(id) {
    if (!confirm('Are you sure you want to delete this bill? The stock will be returned to the inventory and the bill will be permanently removed.')) return;
    
    this.showLoader();
    this.fetchApi('/bills/' + id, 'DELETE').then(res => {
      this.hideLoader();
      if (res.success) {
        alert('Bill successfully deleted and stock restored.');
      } else {
        alert('Failed to delete bill: ' + res.message);
      }
    });
  },

  viewBill(id) {
    const bill = this.cache.bills.find(b => b._id === id);
    if(!bill) return;
    
    let itemsHtml = bill.items.map(i => {
      return `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${i.stock?.designNo}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${i.stock?.designName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${i.pieces}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">Rs.${i.perPiecePrice}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">Rs.${i.pieces * i.perPiecePrice}</td>
      </tr>`;
    }).join('');

    const addressHtml = (bill.party && bill.party.address) ? `<p style="margin: 5px 0;"><strong>Address:</strong> ${bill.party.address}</p>` : '';
    
    const html = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
        <div>
          <p style="margin: 5px 0;"><strong>Bill No:</strong> ${bill.billNo}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(bill.createdAt).toLocaleDateString()}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 5px 0;"><strong>Party:</strong> ${bill.party ? bill.party.name : 'Deleted Party'}</p>
          <p style="margin: 5px 0;"><strong>City:</strong> ${bill.party ? bill.party.city?.name : ''}</p>
          ${addressHtml}
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">DESIGN NO</th>
            <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">DESIGN NAME</th>
            <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">PIECES</th>
            <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">RATE</th>
            <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div style="text-align: right; font-size: 16px;">
        <p style="margin: 5px 0;"><strong>Gross Total:</strong> Rs.${bill.grossTotal}</p>
        <p style="margin: 5px 0; color: #dc3545;"><strong>Discount:</strong> Rs.${bill.discountAmount} (${bill.discountPercent}%)</p>
        <p style="margin: 10px 0; font-size: 20px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px;">Net Total: Rs.${bill.netTotal}</p>
      </div>
    `;

    document.getElementById('bill-modal-content').innerHTML = html;
    document.getElementById('bill-modal').classList.remove('hidden');
  },

  printBillId(id) {
    const bill = this.cache.bills.find(b => b._id === id);
    if(bill) {
      if(bill.status === 'Saved') {
        this.fetchApi('/bills/' + bill._id + '/status', 'PUT', { status: 'Printed' }).then(() => {});
      }
      this.printBill(bill);
    }
  },

  printBill(bill) {
    const pv = document.getElementById('print-view');
    let itemsTr = bill.items.map(i => {
      return `<tr>
        <td>${i.stock?.designNo}</td>
        <td>${i.stock?.designName}</td>
        <td>${i.pieces}</td>
        <td>Rs.${i.perPiecePrice}</td>
        <td>Rs.${i.pieces * i.perPiecePrice}</td>
      </tr>`;
    }).join('');

    const addressHtml = (bill.party && bill.party.address) ? `<p><strong>Address:</strong> ${bill.party.address}</p>` : '';

    pv.innerHTML = `
      <div class="print-header">
        <h1>Alpha One Garments</h1>
        <p>Premium Quality Apparel</p>
      </div>
      <div class="print-meta">
        <div>
          <p><strong>Bill No:</strong> ${bill.billNo}</p>
          <p><strong>Date:</strong> ${new Date(bill.createdAt).toLocaleDateString()}</p>
        </div>
        <div style="text-align: right;">
          <p><strong>Party:</strong> ${bill.party ? bill.party.name : 'Deleted Party'}</p>
          <p><strong>City:</strong> ${bill.party ? bill.party.city?.name : ''}</p>
          ${addressHtml}
        </div>
      </div>
      <table class="print-table">
        <thead>
          <tr>
            <th>DESIGN NO</th>
            <th>DESIGN NAME</th>
            <th>PIECES</th>
            <th>RATE</th>
            <th>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${itemsTr}
        </tbody>
      </table>
      <div class="print-totals">
        <p>Gross Total: Rs.${bill.grossTotal}</p>
        <p style="color: #666; font-size: 14px; margin-top: 5px;">Discount (${bill.discountPercent}%): Rs.${bill.discountAmount}</p>
        <p style="font-size: 20px; margin-top: 10px;"><strong>Net Total: Rs.${bill.netTotal}</strong></p>
      </div>
    `;

    setTimeout(() => {
      document.body.classList.add('print-a3');
      window.print();
      document.body.classList.remove('print-a3');
    }, 200);
  },

  generateBalancePdf() {
    this.showLoader();
    this.fetchApi('/balances').then(res => {
      this.hideLoader();
      if (!res.success) {
        alert('Error generating report: ' + res.message);
        return;
      }

      const byCity = res.report;
      let html = `
          <div class="print-header">
            <h1>All Parties Remaining Balances</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        `;
        
        let grandTotal = 0;

        for (let city of Object.keys(byCity).sort()) {
          html += `<h2 style="color: var(--primary); margin-top: 30px; border-bottom: 2px solid #eee; padding-bottom: 5px;">${city}</h2>`;
          let byAddress = byCity[city];
          for (let addr of Object.keys(byAddress).sort()) {
            if (addr) html += `<h3 style="color: var(--secondary); margin-top: 15px;">${addr}</h3>`;
            html += `
              <table class="print-table" style="margin-top: 10px;">
                <thead><tr><th>PARTY NAME</th><th style="width: 150px;">BALANCE</th></tr></thead>
                <tbody>
            `;
            byAddress[addr].sort((a,b)=>a.name.localeCompare(b.name)).forEach(p => {
              html += `<tr><td>${p.name}</td><td><strong>Rs. ${p.balance}</strong></td></tr>`;
              grandTotal += p.balance;
            });
            html += `
                </tbody>
              </table>
            `;
          }
        }
        
        html += `
          <div class="print-totals" style="font-size: 24px; padding: 20px;">
            <p>Grand Total Outstanding: <strong>Rs. ${grandTotal}</strong></p>
          </div>
        `;
        document.getElementById('print-view').innerHTML = html;
        setTimeout(() => window.print(), 200);
    });
  },

  // --- EDIT MODAL ---
  _editContext: null,

  openEdit(type, id) {
    const modal = document.getElementById('edit-modal');
    const title = document.getElementById('edit-modal-title');
    const fieldsContainer = document.getElementById('edit-modal-fields');
    fieldsContainer.innerHTML = '';

    let fields = [];

    if (type === 'sizeset') {
      const item = this.cache.sizes.find(s => s._id === id);
      if (!item) return;
      title.innerText = 'Edit Size Set';
      fields = [
        { label: 'Name', name: 'name', value: item.name, type: 'text' },
        { label: 'Pieces Per Set', name: 'piecesPerSet', value: item.piecesPerSet, type: 'number' }
      ];
    } else if (type === 'city') {
      const item = this.cache.cities.find(c => c._id === id);
      if (!item) return;
      title.innerText = 'Edit City';
      fields = [
        { label: 'City Name', name: 'name', value: item.name, type: 'text' }
      ];
    } else if (type === 'party') {
      const allParties = [...this.cache.parties, ...this.cache.grParties];
      const item = allParties.find(p => p._id === id);
      if (!item) return;
      title.innerText = 'Edit Party';
      fields = [
        { label: 'Party Name', name: 'name', value: item.name, type: 'text' },
        { label: 'Address / Market', name: 'address', value: item.address || '', type: 'text' }
      ];
    } else if (type === 'stock') {
      const item = this.cache.stock.find(s => s._id === id);
      if (!item) return;
      title.innerText = 'Edit Stock';
      fields = [
        { label: 'Design No', name: 'designNo', value: item.designNo, type: 'text' },
        { label: 'Design Name', name: 'designName', value: item.designName, type: 'text' },
        { label: 'Per Piece Price', name: 'perPiecePrice', value: item.perPiecePrice, type: 'number' },
        { label: 'Total Pieces', name: 'pieces', value: item.pieces, type: 'number' }
      ];
    }

    fields.forEach(f => {
      fieldsContainer.innerHTML += `
        <label style="color: var(--text-muted); font-size: 12px; text-transform: uppercase;">${f.label}</label>
        <input type="${f.type}" name="${f.name}" value="${f.value}" required style="width: 100%;">
      `;
    });

    this._editContext = { type, id };
    modal.classList.remove('hidden');

    // Bind form submit
    const form = document.getElementById('edit-modal-form');
    form.onsubmit = (e) => {
      e.preventDefault();
      this.submitEdit();
    };
  },

  submitEdit() {
    if (!this._editContext) return;
    const { type, id } = this._editContext;
    const form = document.getElementById('edit-modal-form');
    const inputs = form.querySelectorAll('input[name]');
    const update = {};
    inputs.forEach(inp => {
      update[inp.name] = inp.type === 'number' ? Number(inp.value) : inp.value;
    });

    const eventMap = {
      sizeset: 'update_sizeset',
      city: 'update_city',
      party: 'update_party',
      stock: 'update_stock'
    };

    this.showLoader();
    const endpointMap = { sizeset: '/sizesets/', city: '/cities/', party: '/parties/', stock: '/stock/' };
    this.fetchApi(endpointMap[type] + id, 'PUT', { update }).then(res => {
      this.hideLoader();
      if (res.success) {
        this.closeEditModal();
      } else {
        alert('Error: ' + res.message);
      }
    });
  },

  closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    this._editContext = null;
  },

  // --- DELETE ---
  deleteEntry(type, id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    const eventMap = {
      sizeset: 'delete_sizeset',
      city: 'delete_city',
      party: 'delete_party',
      stock: 'delete_stock'
    };

    this.showLoader();
    const endpointMap = { sizeset: '/sizesets/', city: '/cities/', party: '/parties/', stock: '/stock/' };
    this.fetchApi(endpointMap[type] + id, 'DELETE').then(res => {
      this.hideLoader();
      if (!res.success) alert('Error: ' + res.message);
    });
  },

  // --- GR BILLING ---
  initGRBilling() {
    // GR Party search
    this.setupAutocomplete(
      'gr-bill-party-search', 'gr-bill-party', 'gr-bill-party-dropdown', 'gr-selected-party-display',
      () => this.cache.grParties.map(p => ({
        value: p._id,
        searchText: `${p.name} ${p.city?.name || ''} ${p.address || ''}`,
        displayText: `${p.name} - ${p.city?.name || ''}${p.address ? ' - '+p.address : ''}`
      }))
    );

    // GR Add Design row
    const grAddBtn = document.getElementById('gr-add-design-btn');
    if (grAddBtn) {
      grAddBtn.addEventListener('click', () => {
        const rowId = 'gr-row-' + Date.now();
        const searchId = rowId + '-search';
        const hiddenId = rowId + '-hidden';
        const dropdownId = rowId + '-dropdown';

        const rowHtml = `
          <div class="bill-item-row" id="${rowId}">
            <div class="design-select-group" style="position:relative; flex:1;">
              <input type="text" id="${searchId}" class="item-design-search" placeholder="Search GR Design..." autocomplete="off" required>
              <input type="hidden" id="${hiddenId}" class="item-design" required>
              <ul id="${dropdownId}" class="autocomplete-list"></ul>
            </div>
            <input type="number" class="item-pieces" placeholder="Qty (Pieces)" required>
            <div class="row-live-calc">Price: Rs.0 | 0 Sets / 0 Dozens</div>
            <button type="button" class="danger-btn" onclick="document.getElementById('${rowId}').remove()">X</button>
          </div>
        `;
        document.getElementById('gr-bill-items-container').insertAdjacentHTML('beforeend', rowHtml);

        const newRow = document.getElementById(rowId);
        const pieceInput = newRow.querySelector('.item-pieces');
        const calcDisplay = newRow.querySelector('.row-live-calc');
        const hiddenInput = document.getElementById(hiddenId);

        const updateRowCalc = () => {
          if (!hiddenInput.value || !pieceInput.value) { calcDisplay.innerText = "Price: Rs.0 | 0 Sets / 0 Dozens"; return; }
          const price = Number(hiddenInput.dataset.price);
          const piecesPerSet = Number(hiddenInput.dataset.sets);
          const qty = Number(pieceInput.value);
          const sets = Math.floor(qty / piecesPerSet);
          const dozens = Math.floor(qty / 12);
          const remaining = qty % 12;
          calcDisplay.innerText = `Price: Rs.${price} | Total: Rs.${price * qty} | ${sets} Sets / ${dozens} Dozens / ${qty} Total Pcs / ${remaining} Remaining Pcs`;
        };

        this.setupAutocomplete(
          searchId, hiddenId, dropdownId, null,
          () => this.cache.stock.filter(s => s.isGR).map(s => ({
            value: s._id,
            searchText: `${s.designNo} ${s.designName}`,
            displayText: `${s.designNo} - ${s.designName} (Rs.${s.perPiecePrice})`,
            dataset: { price: s.perPiecePrice, sets: s.sizeSet?.piecesPerSet || 1 }
          })),
          updateRowCalc
        );

        pieceInput.addEventListener('input', updateRowCalc);
      });
    }

    // GR Save buttons
    const grSaveOnly = document.getElementById('gr-btn-save-only');
    const grSavePrint = document.getElementById('gr-btn-save-print');
    if (grSaveOnly) grSaveOnly.addEventListener('click', () => this.submitGRBill('Saved'));
    if (grSavePrint) grSavePrint.addEventListener('click', () => this.submitGRBill('Printed'));
  },

  submitGRBill(status) {
    const partyId = document.getElementById('gr-bill-party').value;
    if (!partyId) { alert('Select a GR party first'); return; }

    const rows = document.querySelectorAll('#gr-bill-items-container .bill-item-row');
    if (rows.length === 0) { alert('Add at least one GR design'); return; }

    const items = [];
    let grossTotal = 0;

    for (let row of rows) {
      const dSel = row.querySelector('.item-design');
      const pInp = row.querySelector('.item-pieces');
      if (!dSel.value || !pInp.value) { alert('Fill all item details'); return; }
      const price = Number(dSel.dataset.price);
      const pieces = Number(pInp.value);
      items.push({ stock: dSel.value, pieces, perPiecePrice: price });
      grossTotal += (price * pieces);
    }

    const discountPercent = Number(document.getElementById('gr-bill-discount').value) || 0;
    const discountAmount = grossTotal * (discountPercent / 100);
    const netTotal = grossTotal - discountAmount;

    this.showLoader();
    this.fetchApi('/bills', 'POST', {
      party: partyId, items, discountPercent, grossTotal, discountAmount, netTotal, status, isGR: true
    }).then(res => {
      this.hideLoader();
      if (res.success) {
        alert(`GR Bill Generated! Net Total: Rs.${netTotal}`);
        document.getElementById('gr-bill-party').value = '';
        document.getElementById('gr-selected-party-display').innerText = 'Select a GR party...';
        document.getElementById('gr-bill-items-container').innerHTML = '';
        document.getElementById('gr-bill-discount').value = '32';
        if (status === 'Printed') {
          setTimeout(() => {
            if (this.cache.bills.length > 0) this.printBill(this.cache.bills[0]);
          }, 1000);
        }
      } else {
        alert('Error: ' + res.message);
      }
    });
  },

  setupAutocomplete(searchInputId, hiddenInputId, dropdownId, displayId, dataListCallback, onSelectCallback) {
    const searchInput = document.getElementById(searchInputId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const dropdown = document.getElementById(dropdownId);
    const display = displayId ? document.getElementById(displayId) : null;
    if(!searchInput || !dropdown) return;

    const renderList = (term) => {
      dropdown.innerHTML = '';
      const filtered = dataListCallback().filter(item => item.searchText.toLowerCase().includes(term.toLowerCase()));
      if(filtered.length === 0) {
        dropdown.innerHTML = '<li style="padding:10px;color:var(--text-secondary);">No matches found</li>';
      } else {
        filtered.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item.displayText;
          li.dataset.value = item.value;
          li.addEventListener('click', () => {
            hiddenInput.value = item.value;
            if (display) {
              display.innerText = item.displayText;
              display.style.display = 'block';
            }
            if (item.dataset) {
              Object.keys(item.dataset).forEach(k => hiddenInput.dataset[k] = item.dataset[k]);
            }
            dropdown.style.display = 'none';
            searchInput.value = item.displayText;
            if(onSelectCallback) onSelectCallback(item);
          });
          dropdown.appendChild(li);
        });
      }
    };

    searchInput.addEventListener('focus', () => {
      renderList(searchInput.value);
      dropdown.style.display = 'block';
    });

    searchInput.addEventListener('input', (e) => {
      renderList(e.target.value);
      if(e.target.value === '') {
        hiddenInput.value = '';
        if(onSelectCallback) onSelectCallback();
      }
    });

    document.addEventListener('click', (e) => {
      if(!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }
};

window.onload = () => app.init();

