// Initialize default admin account if none exists
export const initializeAdmin = () => {
  const admins = JSON.parse(localStorage.getItem('admins') || '[]');
  
  if (admins.length === 0) {
    const defaultAdmin = {
      id: 'admin-1',
      email: 'admin@zuxofit.com',
      password: 'admin123',
      name: 'Admin'
    };
    
    admins.push(defaultAdmin);
    localStorage.setItem('admins', JSON.stringify(admins));
    console.log('✅ Default admin account created');
    console.log('📧 Email: admin@zuxofit.com');
    console.log('🔑 Password: admin123');
  }
};

// Initialize demo user account if none exists
export const initializeDemoUser = () => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  if (users.length === 0) {
    const demoUser = {
      id: 'user-1',
      email: 'john@example.com',
      password: 'password123',
      name: 'John Doe'
    };
    
    users.push(demoUser);
    localStorage.setItem('users', JSON.stringify(users));
    console.log('✅ Demo user account created');
    console.log('📧 Email: john@example.com');
    console.log('🔑 Password: password123');
  }
};

// Initialize demo products if none exist
export const initializeDemoProducts = () => {
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  
  if (products.length === 0) {
    const demoProducts = [
      {
        id: '1',
        name: 'Air Max 270',
        brand: 'Nike',
        price: 150,
        category: 'men',
        description: 'The Air Max 270 delivers visible cushioning under every step.',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
        stock: 15
      },
      {
        id: '2',
        name: 'Ultraboost 21',
        brand: 'Adidas',
        price: 180,
        category: 'men',
        description: 'Energy-returning cushioning in every stride.',
        image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800',
        stock: 20
      },
      {
        id: '3',
        name: 'Fresh Foam',
        brand: 'New Balance',
        price: 120,
        category: 'women',
        description: 'Plush comfort for your daily run.',
        image: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800',
        stock: 12
      },
      {
        id: '4',
        name: 'Chuck Taylor',
        brand: 'Converse',
        price: 65,
        category: 'women',
        description: 'Classic canvas sneaker, iconic style.',
        image: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800',
        stock: 25
      }
    ];
    
    localStorage.setItem('products', JSON.stringify(demoProducts));
    console.log('✅ Demo products created');
  }
};

// Initialize demo orders for demo user
export const initializeDemoOrders = (userId) => {
  const ordersKey = `orders-${userId}`;
  const existingOrders = localStorage.getItem(ordersKey);
  
  if (!existingOrders) {
    const demoOrders = [
      {
        id: 'ORD001',
        date: 'September 10, 2026',
        status: 'delivered',
        items: [
          {
            id: 'p1',
            name: 'PHANTOM CARBON V4',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
            price: 285.00,
            quantity: 1,
            size: '10'
          }
        ],
        subtotal: 285.00,
        discount: 0,
        shipping: 0,
        total: 285.00
      },
      {
        id: 'ORD002',
        date: 'September 5, 2026',
        status: 'shipped',
        items: [
          {
            id: 'p5',
            name: 'AURORA SPRINT',
            image: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600',
            price: 265.00,
            quantity: 2,
            size: '8.5'
          }
        ],
        subtotal: 530.00,
        discount: 53.00,
        shipping: 0,
        total: 477.00
      },
      {
        id: 'ORD003',
        date: 'August 28, 2026',
        status: 'delivered',
        items: [
          {
            id: 'p3',
            name: 'VELOCITY ZERO',
            image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600',
            price: 425.00,
            quantity: 1,
            size: '9'
          },
          {
            id: 'p4',
            name: 'KINETIC STRIDE',
            image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600',
            price: 295.00,
            quantity: 1,
            size: '9.5'
          }
        ],
        subtotal: 720.00,
        discount: 0,
        shipping: 0,
        total: 720.00
      }
    ];
    
    localStorage.setItem(ordersKey, JSON.stringify(demoOrders));
    console.log('✅ Demo orders created for user');
  }
};
