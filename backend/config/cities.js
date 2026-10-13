// Sri Lankan city / town / district -> province, used to pre-select the delivery province at checkout.
// Only places whose province is certain are listed; anything else is NOT guessed (the customer picks a province).
const PLACES_BY_PROVINCE = {
  Western: [
    'Colombo', 'Fort', 'Pettah', 'Bambalapitiya', 'Wellawatte', 'Dehiwala', 'Mount Lavinia', 'Moratuwa', 'Ratmalana',
    'Nugegoda', 'Maharagama', 'Kottawa', 'Pannipitiya', 'Homagama', 'Piliyandala', 'Boralesgamuwa', 'Kesbewa',
    'Kotte', 'Sri Jayawardenepura Kotte', 'Battaramulla', 'Rajagiriya', 'Malabe', 'Kaduwela', 'Avissawella', 'Borella',
    'Gampaha', 'Negombo', 'Wattala', 'Ja-Ela', 'Kelaniya', 'Kadawatha', 'Minuwangoda', 'Peliyagoda', 'Ragama',
    'Kiribathgoda', 'Nittambuwa', 'Veyangoda', 'Divulapitiya', 'Katunayake', 'Seeduwa',
    'Kalutara', 'Panadura', 'Horana', 'Beruwala', 'Aluthgama', 'Bandaragama', 'Wadduwa', 'Matugama', 'Ingiriya'
  ],
  Central: [
    'Kandy', 'Peradeniya', 'Gampola', 'Nawalapitiya', 'Kadugannawa', 'Katugastota', 'Digana', 'Pilimatalawa', 'Galagedara',
    'Matale', 'Dambulla', 'Galewela', 'Rattota', 'Ukuwela', 'Sigiriya',
    'Nuwara Eliya', 'Hatton', 'Talawakele', 'Maskeliya'
  ],
  Southern: [
    'Galle', 'Hikkaduwa', 'Unawatuna', 'Ambalangoda', 'Elpitiya', 'Baddegama', 'Ahangama', 'Bentota',
    'Matara', 'Weligama', 'Akuressa', 'Dikwella', 'Mirissa', 'Deniyaya', 'Kamburupitiya',
    'Hambantota', 'Tangalle', 'Tissamaharama', 'Beliatta', 'Ambalantota'
  ],
  Northern: [
    'Jaffna', 'Point Pedro', 'Chavakachcheri', 'Nallur', 'Kankesanthurai', 'Kilinochchi', 'Pooneryn',
    'Mannar', 'Vavuniya', 'Mullaitivu', 'Mankulam', 'Mallavi'
  ],
  Eastern: [
    'Trincomalee', 'Kinniya', 'Mutur', 'Kantale', 'Batticaloa', 'Kattankudy', 'Eravur', 'Valachchenai',
    'Ampara', 'Kalmunai', 'Akkaraipattu', 'Sainthamaruthu', 'Sammanthurai', 'Pottuvil', 'Uhana', 'Dehiattakandiya'
  ],
  'North Western': [
    'Kurunegala', 'Kuliyapitiya', 'Narammala', 'Wariyapola', 'Pannala', 'Mawathagama', 'Polgahawela', 'Alawwa',
    'Nikaweratiya', 'Galgamuwa', 'Maho', 'Ibbagamuwa',
    'Puttalam', 'Chilaw', 'Wennappuwa', 'Marawila', 'Dankotuwa', 'Anamaduwa', 'Nattandiya', 'Madampe', 'Kalpitiya'
  ],
  'North Central': [
    'Anuradhapura', 'Kekirawa', 'Mihintale', 'Medawachchiya', 'Thambuttegama', 'Eppawala', 'Galenbindunuwewa',
    'Polonnaruwa', 'Hingurakgoda', 'Medirigiriya', 'Kaduruwela', 'Welikanda'
  ],
  Uva: [
    'Badulla', 'Bandarawela', 'Haputale', 'Welimada', 'Ella', 'Passara', 'Mahiyanganaya', 'Diyatalawa', 'Hali-Ela', 'Lunugala',
    'Monaragala', 'Moneragala', 'Wellawaya', 'Bibile', 'Buttala'
  ],
  Sabaragamuwa: [
    'Ratnapura', 'Balangoda', 'Embilipitiya', 'Rakwana', 'Pelmadulla', 'Eheliyagoda', 'Kuruwita', 'Godakawela',
    'Kegalle', 'Kegalla', 'Mawanella', 'Warakapola', 'Rambukkana', 'Ruwanwella', 'Dehiowita', 'Galigamuwa',
    'Yatiyantota', 'Deraniyagala'
  ]
};

// Letters only, lower case: "Mount-Lavinia", "mount lavinia" and "Ja Ela" all match their entry.
const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z]/g, '');

const CITY_PROVINCES = {};
Object.entries(PLACES_BY_PROVINCE).forEach(([province, places]) => {
  places.forEach((place) => {
    CITY_PROVINCES[normalize(place)] = province;
  });
});

// "Colombo 07" -> Western, "Nugegoda, Colombo" -> Western, "Kandy, Sri Lanka" -> Central. Unknown places -> ''.
function provinceForCity(city) {
  const parts = String(city || '').split(',');
  for (const part of parts) {
    const province = CITY_PROVINCES[normalize(part)];
    if (province) return province;
  }
  return '';
}

module.exports = {
  CITY_PROVINCES,
  provinceForCity
};