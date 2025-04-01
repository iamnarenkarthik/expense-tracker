const API_URL = 'http://localhost:5000/api/expenses';
let expenses = [];

// DOM Elements
const expenseForm = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const todayTotalEl = document.getElementById('today-total');
const monthTotalEl = document.getElementById('month-total');
const allTimeTotalEl = document.getElementById('all-time-total');
const filterButtons = document.querySelectorAll('.filter-btn');
const customDateInput = document.getElementById('custom-date');
const themeToggle = document.getElementById('theme-toggle');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('expense-date').value = today;
  
  // Load initial expenses
  loadExpenses('today');
  
  // Set up event listeners
  expenseForm.addEventListener('submit', addExpense);
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => setActiveFilter(btn));
  });
  customDateInput.addEventListener('change', () => {
    loadExpenses('custom', customDateInput.value);
  });
  themeToggle.addEventListener('click', toggleTheme);
});

// Load expenses with filter
async function loadExpenses(filterType, customDate = null) {
  try {
    let url = API_URL;
    
    if (filterType === 'today') {
      const today = new Date().toISOString().split('T')[0];
      url += `?date=${today}`;
    } else if (filterType === 'month') {
      const now = new Date();
      url += `?month=${now.getMonth()+1}&year=${now.getFullYear()}`;
    } else if (filterType === 'custom' && customDate) {
      url += `?date=${customDate}`;
    }
    
    const response = await fetch(url);
    expenses = await response.json();
    renderExpenses();
    updateTotals();
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to load expenses');
  }
}

// Add new expense
async function addExpense(e) {
  e.preventDefault();
  
  const name = document.getElementById('expense-name').value.trim();
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;
  const paymentMode = document.getElementById('payment-mode').value;
  const date = document.getElementById('expense-date').value;

  if (!name || isNaN(amount) || !category || !date) {
    alert('Please fill all fields correctly!');
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, amount, category, paymentMode, date })
    });

    if (response.ok) {
      // Clear form
      expenseForm.reset();
      document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
      
      // Reload current filter
      const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
      loadExpenses(activeFilter);
    }
  } catch (error) {
    console.error('Error adding expense:', error);
    alert('Failed to add expense');
  }
}

// Render expenses list
function renderExpenses() {
  expenseList.innerHTML = '';
  
  if (expenses.length === 0) {
    expenseList.innerHTML = '<li class="no-expenses">No expenses found</li>';
    return;
  }
  
  expenses.forEach(expense => {
    const li = document.createElement('li');
    li.className = 'expense-item';
    
    // Payment mode icon
    let paymentIcon;
    switch(expense.paymentMode) {
      case 'Cash': paymentIcon = 'fa-money-bill-wave'; break;
      case 'GPay': paymentIcon = 'fa-google'; break;
      case 'Card': paymentIcon = 'fa-credit-card'; break;
      case 'UPI': paymentIcon = 'fa-mobile-screen'; break;
    }
    
    li.innerHTML = `
      <div class="expense-name">
        <strong>${expense.name}</strong>
        <small>${expense.category} • ${formatDate(expense.date)}</small>
      </div>
      <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
      <div class="payment-mode ${'payment-' + expense.paymentMode.toLowerCase()}">
        <i class="fas ${paymentIcon}"></i> ${expense.paymentMode}
      </div>
    `;
    
    expenseList.appendChild(li);
  });
}

// Update summary totals
function updateTotals() {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  // Today's total
  const todayTotal = expenses
    .filter(e => new Date(e.date).toISOString().split('T')[0] === today)
    .reduce((sum, e) => sum + e.amount, 0);
  
  // Monthly total
  const monthTotal = expenses
    .filter(e => {
      const expDate = new Date(e.date);
      return expDate.getMonth() + 1 === currentMonth && 
             expDate.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);
  
  // Filtered total
  const filteredTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Update UI
  todayTotalEl.textContent = `₹${todayTotal.toFixed(2)}`;
  monthTotalEl.textContent = `₹${monthTotal.toFixed(2)}`;
  allTimeTotalEl.textContent = `₹${filteredTotal.toFixed(2)}`;
}

// Helper function to format date
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Set active filter
function setActiveFilter(btn) {
  filterButtons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadExpenses(btn.dataset.filter);
}

// Toggle theme
function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', newTheme);
  themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  localStorage.setItem('theme', newTheme);
}

// Check for saved theme preference
if (localStorage.getItem('theme') === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
  themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}