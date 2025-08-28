// utils.js
// Convert "2024-25" → { start: 2024-04-01, end: 2025-03-31 }
function getFYRange(fy) {
    try {
        const parts = fy.split("-");
        if (parts.length < 2) return null;

        const startYear = parseInt(parts[0], 10);
        if (isNaN(startYear)) return null;

        return {
            start: new Date(`${startYear}-04-01`),
            end: new Date(`${startYear + 1}-03-31`),
        };
    } catch (err) {
        return null;
    }
}

module.exports = { getFYRange };