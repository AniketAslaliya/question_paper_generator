const axios = require('axios');

const testLogin = async () => {
    try {
        console.log('Testing login with admin@qpg.com...');

        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@qpg.com',
            password: 'admin123'
        });

        console.log('\n✅ LOGIN SUCCESSFUL!');
        console.log('Token:', response.data.token.substring(0, 20) + '...');
        console.log('User:', response.data.user);

    } catch (error) {
        console.log('\n❌ LOGIN FAILED!');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.message || error.message);
    }
};

testLogin();
