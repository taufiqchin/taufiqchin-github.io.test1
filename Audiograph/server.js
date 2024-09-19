// Temporary storage for 3 users
const users = [
    { reAir: null, reAirMasked: null, reBone: null, reBoneMasked: null, leAir: null, leAirMasked: null, leBone: null, leBoneMasked: null },
    { reAir: null, reAirMasked: null, reBone: null, reBoneMasked: null, leAir: null, leAirMasked: null, leBone: null, leBoneMasked: null },
    { reAir: null, reAirMasked: null, reBone: null, reBoneMasked: null, leAir: null, leAirMasked: null, leBone: null, leBoneMasked: null }
];

let currentUserIndex = 0;

function loadUserData() {
    currentUserIndex = document.getElementById("userSelect").value;
    const userData = users[currentUserIndex];

    document.getElementById("reAir").value = userData.reAir || '';
    document.getElementById("reAirMasked").value = userData.reAirMasked || '';
    document.getElementById("reBone").value = userData.reBone || '';
    document.getElementById("reBoneMasked").value = userData.reBoneMasked || '';
    document.getElementById("leAir").value = userData.leAir || '';
    document.getElementById("leAirMasked").value = userData.leAirMasked || '';
    document.getElementById("leBone").value = userData.leBone || '';
    document.getElementById("leBoneMasked").value = userData.leBoneMasked || '';
}

function saveData() {
    users[currentUserIndex] = {
        reAir: document.getElementById("reAir").value,
        reAirMasked: document.getElementById("reAirMasked").value,
        reBone: document.getElementById("reBone").value,
        reBoneMasked: document.getElementById("reBoneMasked").value,
        leAir: document.getElementById("leAir").value,
        leAirMasked: document.getElementById("leAirMasked").value,
        leBone: document.getElementById("leBone").value,
        leBoneMasked: document.getElementById("leBoneMasked").value
    };
}

function generateAudiogram() {
    const ctx = document.getElementById('audiogramCanvas').getContext('2d');
    const userData = users[currentUserIndex];

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['250', '500', '1000', '2000', '4000', '8000'],  // Example frequencies
            datasets: [{
                label: 'RE Air',
                data: [userData.reAir, userData.reAirMasked, userData.reBone, userData.reBoneMasked],
                borderColor: 'red',
                fill: false
            }, {
                label: 'LE Air',
                data: [userData.leAir, userData.leAirMasked, userData.leBone, userData.leBoneMasked],
                borderColor: 'blue',
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    reverse: true,  // Audiograms have low to high decibels from top to bottom
                    min: 0,
                    max: 120
                }
            }
        }
    });
}

function downloadAudiogram() {
    const link = document.createElement('a');
    link.href = document.getElementById('audiogramCanvas').toDataURL('image/png');
    link.download = 'audiogram.png';
    link.click();
}
