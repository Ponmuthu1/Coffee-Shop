// public/main.js
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  function updateTime() {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
      const now = new Date();
      timeElement.textContent = now.toLocaleTimeString();
    }
  }

  setInterval(updateTime, 1000);
  updateTime();

  if (currentPage === 'signup.html' || currentPage === 'login.html') {
    if (userId) {
      window.location.href = 'index.html';
      return;
    }

    if (currentPage === 'signup.html') {
      // Signup logic
      const signupForm = document.getElementById('signup-form');

      signupForm.addEventListener('submit', e => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        // Strong password check
        const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if (!passwordPattern.test(password)) {
          alert('Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.');
          return;
        }

        fetch('/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        })
          .then(res => res.json())
          .then(data => {
            alert(data.message);
            if (data.message === 'Signup successful') {
              window.location.href = 'login.html';
            }
          });
      });
    } else if (currentPage === 'login.html') {
      // Login logic
      const loginForm = document.getElementById('login-form');

      loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        })
          .then(res => res.json())
          .then(data => {
            if (data.userId) {
              localStorage.setItem('userId', data.userId);
              localStorage.setItem('username', data.username);
              window.location.href = 'index.html';
            } else {
              alert(data.message);
            }
          });
      });
    }
  } else {
    if (!userId) {
      window.location.href = 'login.html';
      return;
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
      });
    }

    // Show username in navbar
    const greetingElement = document.getElementById('greeting');
    if (greetingElement && username) {
      greetingElement.textContent = `Hello, ${username}`;
    }

    if (currentPage === 'index.html') {
      // Home page logic
      // No specific logic for the home page
    } else if (currentPage === 'menu.html') {
      // Load menu items
      const menuList = document.getElementById('menu-list');

      fetch('/menu')
        .then(res => res.json())
        .then(data => {
          menuList.innerHTML = '';
          data.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
              <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px;" />
              <span>${item.name}: Rs ${item.price}</span>
              <p>${item.description}</p>
              <button onclick="addToOrder('${item._id}', '${item.name}', ${item.price})">Add to Order</button>
            `;
            menuList.appendChild(li);
          });
        });

      // Add to order function
      window.addToOrder = function(id, name, price) {
        const orderItems = JSON.parse(localStorage.getItem('orderItems')) || [];
        const existingItem = orderItems.find(item => item.id === id);
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          orderItems.push({ id, name, price, quantity: 1 });
        }
        localStorage.setItem('orderItems', JSON.stringify(orderItems));
        alert(`${name} added to order`);
      };
    } else if (currentPage === 'order.html') {
      // Order management logic
      const orderList = document.getElementById('order-list');
      const totalAmountElement = document.getElementById('total-amount');
      const placeOrderBtn = document.getElementById('place-order-btn');

      let orderItems = JSON.parse(localStorage.getItem('orderItems')) || [];
      let totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      function updateOrder() {
        orderList.innerHTML = '';
        orderItems.forEach(item => {
          const li = document.createElement('li');
          li.innerHTML = `
            <span>${item.name} (x${item.quantity}): Rs ${item.price * item.quantity}</span>
            <button onclick="removeFromOrder('${item.id}')">Remove</button>
          `;
          orderList.appendChild(li);
        });
        totalAmountElement.textContent = totalAmount.toFixed(2);
      }

      window.removeFromOrder = function(id) {
        const index = orderItems.findIndex(item => item.id === id);
        if (index !== -1) {
          totalAmount -= orderItems[index].price * orderItems[index].quantity;
          orderItems.splice(index, 1);
          localStorage.setItem('orderItems', JSON.stringify(orderItems));
          updateOrder();
        }
      };

      placeOrderBtn.addEventListener('click', () => {
        fetch('/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            userid: userId
          },
          body: JSON.stringify({ items: orderItems, totalAmount })
        }).then(() => {
          alert('Order placed successfully');
          orderItems = [];
          totalAmount = 0;
          localStorage.removeItem('orderItems');
          updateOrder();
        });
      });

      updateOrder();
    } else if (currentPage === 'summary.html') {
      // Summary page logic
      const orderList = document.getElementById('order-list');
      const totalSpentElement = document.getElementById('total-spent');

      fetch('/orders', {
        headers: { userid: userId }
      })
        .then(res => res.json())
        .then(data => {
          orderList.innerHTML = '';
          let totalSpent = 0;
          data.forEach(order => {
            totalSpent += order.totalAmount;
            const orderDiv = document.createElement('div');
            orderDiv.classList.add('order-summary');
            orderDiv.innerHTML = `
              <h3>Order Date: ${new Date(order.date).toLocaleString()}</h3>
              <p>Total Amount: Rs ${order.totalAmount.toFixed(2)}</p>
              <ul>
                ${order.items.map(item => `<li>${item.name} (x${item.quantity}): Rs ${item.price * item.quantity}</li>`).join('')}
              </ul>
            `;
            orderList.appendChild(orderDiv);
          });
          totalSpentElement.textContent = `Total Spent: Rs ${totalSpent.toFixed(2)}`;
        });

      const backBtn = document.getElementById('back-btn');
      backBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
      });
    }
  }
});