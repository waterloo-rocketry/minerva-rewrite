console.log('There is nothing here yet.');
console.error('This is an error.');

// Simulating a failure after a short delay
setTimeout(() => {
    throw new Error('Simulated failure');
}, 1000);

while (true) {}
