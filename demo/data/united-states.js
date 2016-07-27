'use strict';

(function() {
    window.unitedStates = [
        { name: 'Alabama', code: 'AL', capital: 'Montgomery', city: 'Birmingham', founded: 'December 14, 1819', population: 4858979, areaTotalMi: 52420, areaTotalKm: 135767, areaLandMi: 50645, areaLandKm: 131170, areaWaterMi: 1775, areaWaterKm: 4597, reps: 7 },
        { name: 'Alaska', code: 'AK', capital: 'Juneau', city: 'Anchorage', founded: 'January 3, 1959', population: 738432, areaTotalMi: 665384, areaTotalKm: 1723337, areaLandMi: 570641, areaLandKm: 1477950, areaWaterMi: 94743, areaWaterKm: 245383, reps: 1 },
        { name: 'Arizona', code: 'AZ', capital: 'Phoenix', city: 'Phoenix', founded: 'February 14, 2012', population: 6828065, areaTotalMi: 113990, areaTotalKm: 295233, areaLandMi: 113594, areaLandKm: 294207, areaWaterMi: 396, areaWaterKm: 1026, reps: 9 },
        { name: 'Arkansas', code: 'AR', capital: 'Little Rock', city: 'Little Rock', founded: 'June 15, 1836', population: 2978204, areaTotalMi: 53179, areaTotalKm: 137733, areaLandMi: 52035, areaLandKm: 134770, areaWaterMi: 1143, areaWaterKm: 2960, reps: 4 },
        { name: 'California', code: 'CA', capital: 'Sacramento', city: 'Los Angeles', founded: 'September 9, 1850', population: 39144818, areaTotalMi: 163695, areaTotalKm: 423968, areaLandMi: 155779, areaLandKm: 403466, areaWaterMi: 7916, areaWaterKm: 20502, reps: 53 },
        { name: 'Colorado', code: 'CO', capital: 'Denver', city: 'Denver', founded: 'August 1, 1876', population: 5456574, areaTotalMi: 104094, areaTotalKm: 269602, areaLandMi: 103642, areaLandKm: 268432, areaWaterMi: 452, areaWaterKm: 1171, reps: 7 },
        { name: 'Connecticut', code: 'CT', capital: 'Hartford', city: 'Atlanta', founded: 'January 9, 1788', population: 3590886, areaTotalMi: 5543, areaTotalKm: 14356, areaLandMi: 4842, areaLandKm: 12541, areaWaterMi: 701, areaWaterKm: 1816, reps: 5 },
        { name: 'Delaware', code: 'DE', capital: 'Dover', city: 'Wilmington', founded: 'December 7, 1787', population: 945934, areaTotalMi: 2489, areaTotalKm: 6446, areaLandMi: 1949, areaLandKm: 5048, areaWaterMi: 540, areaWaterKm: 1399, reps: 1 },
        { name: 'District of Columbia', code: 'DC', capital: 'Washington', city: 'Washington', founded: 'July 16, 1790', population: 672228, areaTotalMi: 68, areaTotalKm: 176, areaLandMi: 61, areaLandKm: 158, areaWaterMi: 7, areaWaterKm: 18, reps: 1 },
        { name: 'Florida', code: 'FL', capital: 'Tallahassee', city: 'Jacksonville', founded: 'March 3, 1845', population: 20271272, areaTotalMi: 65758, areaTotalKm: 170312, areaLandMi: 53625, areaLandKm: 138888, areaWaterMi: 12133, areaWaterKm: 31424, reps: 27 },
        { name: 'Georgia', code: 'GA', capital: 'Atlanta', city: 'Atlanta', founded: 'January 2, 1788', population: 10214860, areaTotalMi: 59425, areaTotalKm: 153910, areaLandMi: 57513, areaLandKm: 148958, areaWaterMi: 1912, areaWaterKm: 4950, reps: 14 },
        { name: 'Hawaii', code: 'HI', capital: 'Honolulu', city: 'Honolulu', founded: 'August 21, 1959', population: 1431603, areaTotalMi: 10932, areaTotalKm: 28314, areaLandMi: 6423, areaLandKm: 16635, areaWaterMi: 4509, areaWaterKm: 11678, reps: 2 },
        { name: 'Idaho', code: 'ID', capital: 'Boise', city: 'Boise', founded: 'July 3, 1890', population: 1654930, areaTotalMi: 83569, areaTotalKm: 216443, areaLandMi: 82643, areaLandKm: 214044, areaWaterMi: 926, areaWaterKm: 2398, reps: 2 },
        { name: 'Illinois', code: 'IL', capital: 'Springfield', city: 'Chicago', founded: 'December 3, 1818', population: 12859995, areaTotalMi: 57914, areaTotalKm: 149997, areaLandMi: 55519, areaLandKm: 143794, areaWaterMi: 2395, areaWaterKm: 6203, reps: 18 },
        { name: 'Indiana', code: 'IN', capital: 'Indianapolis', city: 'Indianapolis', founded: 'December 11, 1816', population: 6619680, areaTotalMi: 36420, areaTotalKm: 94327, areaLandMi: 35826, areaLandKm: 92789, areaWaterMi: 593, areaWaterKm: 1536, reps: 9 },
        { name: 'Iowa', code: 'IA', capital: 'Des Moines', city: 'Des Moines', founded: 'December 28, 1846', population: 3123899, areaTotalMi: 56273, areaTotalKm: 145746, areaLandMi: 55857, areaLandKm: 144669, areaWaterMi: 416, areaWaterKm: 1077, reps: 4 },
        { name: 'Kansas', code: 'KS', capital: 'Topeka', city: 'Wichita', founded: 'January 29, 1861', population: 2911641, areaTotalMi: 82278, areaTotalKm: 213099, areaLandMi: 81759, areaLandKm: 211755, areaWaterMi: 520, areaWaterKm: 1347, reps: 4 },
        { name: 'Kentucky[D]', code: 'KY', capital: 'Frankfort', city: 'Louisville', founded: 'June 1, 1792', population: 4425092, areaTotalMi: 40408, areaTotalKm: 104656, areaLandMi: 39486, areaLandKm: 102268, areaWaterMi: 921, areaWaterKm: 2385, reps: 6 },
        { name: 'Louisiana', code: 'LA', capital: 'Baton Rouge', city: 'New Orleans', founded: 'April 30, 1812', population: 4670724, areaTotalMi: 52378, areaTotalKm: 135658, areaLandMi: 43204, areaLandKm: 111898, areaWaterMi: 9174, areaWaterKm: 23761, reps: 6 },
        { name: 'Maine', code: 'ME', capital: 'Augusta', city: 'Portland', founded: 'March 15, 1820', population: 1329328, areaTotalMi: 35380, areaTotalKm: 91634, areaLandMi: 30843, areaLandKm: 79883, areaWaterMi: 4537, areaWaterKm: 11751, reps: 2 },
        { name: 'Maryland', code: 'MD', capital: 'Annapolis', city: 'Baltimore', founded: 'April 28, 1788', population: 6006401, areaTotalMi: 12406, areaTotalKm: 32131, areaLandMi: 9707, areaLandKm: 25141, areaWaterMi: 2699, areaWaterKm: 6990, reps: 8 },
        { name: 'Massachusetts[E]', code: 'MA', capital: 'Boston', city: 'Boston', founded: 'February 6, 1788', population: 6794422, areaTotalMi: 10554, areaTotalKm: 27335, areaLandMi: 7800, areaLandKm: 20202, areaWaterMi: 2754, areaWaterKm: 7133, reps: 9 },
        { name: 'Michigan', code: 'MI', capital: 'Lansing', city: 'Detroit', founded: 'January 26, 1837', population: 9922576, areaTotalMi: 96714, areaTotalKm: 250488, areaLandMi: 56539, areaLandKm: 146435, areaWaterMi: 40175, areaWaterKm: 104053, reps: 14 },
        { name: 'Minnesota', code: 'MN', capital: 'St. Paul', city: 'Minneapolis', founded: 'May 11, 1858', population: 5489594, areaTotalMi: 86936, areaTotalKm: 225163, areaLandMi: 79627, areaLandKm: 206233, areaWaterMi: 7309, areaWaterKm: 18930, reps: 8 },
        { name: 'Mississippi', code: 'MS', capital: 'Jackson', city: 'Jackson', founded: 'December 10, 1817', population: 2992333, areaTotalMi: 48432, areaTotalKm: 125438, areaLandMi: 46923, areaLandKm: 121530, areaWaterMi: 1509, areaWaterKm: 3908, reps: 4 },
        { name: 'Missouri', code: 'MO', capital: 'Jefferson City', city: 'Kansas City', founded: 'August 10, 1821', population: 6083672, areaTotalMi: 69707, areaTotalKm: 180540, areaLandMi: 68742, areaLandKm: 178041, areaWaterMi: 965, areaWaterKm: 2499, reps: 8 },
        { name: 'Montana', code: 'MT', capital: 'Helena', city: 'Billings', founded: 'November 8, 1889', population: 1032949, areaTotalMi: 147040, areaTotalKm: 380832, areaLandMi: 145546, areaLandKm: 376962, areaWaterMi: 1494, areaWaterKm: 3869, reps: 1 },
        { name: 'Nebraska', code: 'NE', capital: 'Lincoln', city: 'Omaha', founded: 'March 1, 1867', population: 1896190, areaTotalMi: 77348, areaTotalKm: 200330, areaLandMi: 76824, areaLandKm: 198973, areaWaterMi: 524, areaWaterKm: 1357, reps: 3 },
        { name: 'Nevada', code: 'NV', capital: 'Carson City', city: 'Las Vegas', founded: 'October 31, 1864', population: 2890845, areaTotalMi: 110572, areaTotalKm: 286380, areaLandMi: 109781, areaLandKm: 284331, areaWaterMi: 791, areaWaterKm: 2049, reps: 4 },
        { name: 'New Hampshire', code: 'NH', capital: 'Concord', city: 'Manchester', founded: 'June 21, 1788', population: 1330608, areaTotalMi: 9349, areaTotalKm: 24214, areaLandMi: 8953, areaLandKm: 23188, areaWaterMi: 397, areaWaterKm: 1028, reps: 2 },
        { name: 'New Jersey', code: 'NJ', capital: 'Trenton', city: 'Newark', founded: 'December 18, 1787', population: 8958013, areaTotalMi: 8723, areaTotalKm: 22592, areaLandMi: 7354, areaLandKm: 19047, areaWaterMi: 1368, areaWaterKm: 3543, reps: 12 },
        { name: 'New Mexico', code: 'NM', capital: 'Santa Fe', city: 'Albuquerque', founded: 'January 6, 2012', population: 2085109, areaTotalMi: 121590, areaTotalKm: 314917, areaLandMi: 121298, areaLandKm: 314160, areaWaterMi: 292, areaWaterKm: 756, reps: 3 },
        { name: 'New York', code: 'NY', capital: 'Albany', city: 'New York', founded: 'July 26, 1788', population: 19795791, areaTotalMi: 54555, areaTotalKm: 141297, areaLandMi: 47126, areaLandKm: 122056, areaWaterMi: 7429, areaWaterKm: 19241, reps: 27 },
        { name: 'North Carolina', code: 'NC', capital: 'Raleigh', city: 'Charlotte', founded: 'November 21, 1789', population: 10042802, areaTotalMi: 53819, areaTotalKm: 139391, areaLandMi: 48618, areaLandKm: 125920, areaWaterMi: 5201, areaWaterKm: 13471, reps: 13 },
        { name: ' North Dakota', code: 'ND', capital: 'Bismarck', city: 'Fargo', founded: 'November 2, 1889', population: 756927, areaTotalMi: 70698, areaTotalKm: 183107, areaLandMi: 69001, areaLandKm: 178712, areaWaterMi: 1698, areaWaterKm: 4398, reps: 1 },
        { name: 'Ohio', code: 'OH', capital: 'Columbus', city: 'Columbus', founded: 'March 1, 1803', population: 11613423, areaTotalMi: 44826, areaTotalKm: 116099, areaLandMi: 40861, areaLandKm: 105830, areaWaterMi: 3965, areaWaterKm: 10269, reps: 16 },
        { name: 'Oklahoma', code: 'OK', capital: 'Oklahoma City', city: 'Oklahoma City', founded: 'November 16, 2007', population: 3911338, areaTotalMi: 69899, areaTotalKm: 181038, areaLandMi: 68595, areaLandKm: 177660, areaWaterMi: 1304, areaWaterKm: 3377, reps: 5 },
        { name: 'Oregon', code: 'OR', capital: 'Salem', city: 'Portland', founded: 'February 14, 1859', population: 4028977, areaTotalMi: 98379, areaTotalKm: 254800, areaLandMi: 95988, areaLandKm: 248608, areaWaterMi: 2391, areaWaterKm: 6193, reps: 5 },
        { name: 'Pennsylvania[F]', code: 'PA', capital: 'Harrisburg', city: 'Philadelphia', founded: 'December 12, 1787', population: 12802503, areaTotalMi: 46054, areaTotalKm: 119279, areaLandMi: 44743, areaLandKm: 115884, areaWaterMi: 1312, areaWaterKm: 3398, reps: 18 },
        { name: 'Rhode Island[G]', code: 'RI', capital: 'Providence', city: 'Providence', founded: 'May 29, 1790', population: 1056298, areaTotalMi: 1545, areaTotalKm: 4002, areaLandMi: 1034, areaLandKm: 2678, areaWaterMi: 511, areaWaterKm: 1320, reps: 2 },
        { name: 'South Carolina', code: 'SC', capital: 'Columbia', city: 'Columbia', founded: 'May 23, 1788', population: 4896146, areaTotalMi: 32020, areaTotalKm: 82931, areaLandMi: 30061, areaLandKm: 77858, areaWaterMi: 1960, areaWaterKm: 5076, reps: 7 },
        { name: 'South Dakota', code: 'SD', capital: 'Pierre', city: 'Sioux Falls', founded: 'November 2, 1889', population: 858469, areaTotalMi: 77116, areaTotalKm: 199730, areaLandMi: 75811, areaLandKm: 196350, areaWaterMi: 1305, areaWaterKm: 3380, reps: 1 },
        { name: 'Tennessee', code: 'TN', capital: 'Nashville', city: 'Memphis', founded: 'June 1, 1796', population: 6600299, areaTotalMi: 42144, areaTotalKm: 109152, areaLandMi: 41235, areaLandKm: 106798, areaWaterMi: 909, areaWaterKm: 2354, reps: 9 },
        { name: 'Texas', code: 'TX', capital: 'Austin', city: 'Houston', founded: 'December 29, 1845', population: 27469114, areaTotalMi: 268596, areaTotalKm: 695660, areaLandMi: 261232, areaLandKm: 676588, areaWaterMi: 7365, areaWaterKm: 19075, reps: 36 },
        { name: 'Utah', code: 'UT', capital: 'Salt Lake City', city: 'Salt Lake City', founded: 'January 4, 1896', population: 2995919, areaTotalMi: 84897, areaTotalKm: 219882, areaLandMi: 82170, areaLandKm: 212819, areaWaterMi: 2727, areaWaterKm: 7063, reps: 4 },
        { name: 'Vermont', code: 'VT', capital: 'Montpelier', city: 'Burlington', founded: 'March 4, 1791', population: 626042, areaTotalMi: 9616, areaTotalKm: 24905, areaLandMi: 9217, areaLandKm: 23872, areaWaterMi: 400, areaWaterKm: 1036, reps: 1 },
        { name: 'Virginia[H]', code: 'VA', capital: 'Richmond', city: 'Virginia Beach', founded: 'June 25, 1788', population: 8382993, areaTotalMi: 42775, areaTotalKm: 110787, areaLandMi: 39490, areaLandKm: 102279, areaWaterMi: 3285, areaWaterKm: 8508, reps: 11 },
        { name: 'Washington', code: 'WA', capital: 'Olympia', city: 'Seattle', founded: 'November 11, 1889', population: 7170351, areaTotalMi: 71298, areaTotalKm: 184661, areaLandMi: 66456, areaLandKm: 172120, areaWaterMi: 4842, areaWaterKm: 12541, reps: 10 },
        { name: 'West Virginia', code: 'WV', capital: 'Charleston', city: 'Charleston', founded: 'June 20, 1863', population: 1844128, areaTotalMi: 24230, areaTotalKm: 62755, areaLandMi: 24038, areaLandKm: 62258, areaWaterMi: 192, areaWaterKm: 497, reps: 3 },
        { name: 'Wisconsin', code: 'WI', capital: 'Madison', city: 'Milwaukee', founded: 'May 29, 1848', population: 5771337, areaTotalMi: 65496, areaTotalKm: 169634, areaLandMi: 54158, areaLandKm: 140269, areaWaterMi: 11339, areaWaterKm: 29368, reps: 8 },
        { name: 'Wyoming', code: 'WY', capital: 'Cheyenne', city: 'Cheyenne', founded: 'July 10, 1890', population: 586107, areaTotalMi: 97813, areaTotalKm: 253335, areaLandMi: 97093, areaLandKm: 251470, areaWaterMi: 720, areaWaterKm: 1865, reps: 1 }
    ];
})();
