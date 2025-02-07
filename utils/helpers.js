//* Generates a secure random password
const generateRandomPassword = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return password;
};

//* Generates a 4-digit random PIN
const generateRandomPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); //? Generates a number between 1000-9999
};

module.exports = { generateRandomPassword, generateRandomPin };
