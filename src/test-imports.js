// Test imports
import apiService from './services/apiService';
const { authAPI, setToken, getToken, removeToken } = apiService;

console.log('authAPI:', authAPI);
console.log('setToken:', setToken);
console.log('getToken:', getToken);
console.log('removeToken:', removeToken);

// Test token functions
setToken('test-token');
console.log('Token after setToken:', getToken());
removeToken();
console.log('Token after removeToken:', getToken());
