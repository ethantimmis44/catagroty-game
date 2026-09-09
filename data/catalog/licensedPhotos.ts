import { commonsImage, type CatalogImage } from "@/data/catalog/types";

/**
 * Human-curated Wikimedia Commons photographs of the actual item.
 * Cosplay, statues, arcade cabinets, product photos, filming exhibits, and
 * public-domain film stills only. Generated vector cards are never listed.
 */
const FILES: Record<string, { file: string; focus?: { x: number; y: number } }> = {
  "spider-man": { file: "Asia_Comic_Expo_2023_-_Spider-Man_cosplay_1.jpg", focus: { x: 0.5, y: 0.28 } },
  "iron man": { file: "Iron_Man_Cosplay_-_MCM_Comic_Con_2016_(27398644375).jpg", focus: { x: 0.5, y: 0.28 } },
  "captain america": { file: "Captain_America_Cosplay_at_WonderCon_2011.jpg", focus: { x: 0.5, y: 0.28 } },
  hulk: { file: "Cosplay_of_Hulk_at_Brussels_Comic_Con_2019_(33424478778).jpg", focus: { x: 0.5, y: 0.28 } },
  thor: { file: "Cosplay_of_Thor_at_Brussels_Comic_Con_2019_(32535143797).jpg", focus: { x: 0.5, y: 0.28 } },
  deadpool: { file: "Deadpool_Cosplay_at_NYCC_2017.jpg", focus: { x: 0.5, y: 0.28 } },
  "black panther": { file: "Black_Panther_cosplay.jpg", focus: { x: 0.5, y: 0.28 } },
  "black widow": { file: "WonderCon_2017_-_Black_Widow_Cosplay.jpg", focus: { x: 0.5, y: 0.28 } },
  "doctor strange": { file: "Cosplay_of_Doctor_Strange_at_Brussels_Comic_Con_2019_(47248018322).jpg", focus: { x: 0.5, y: 0.28 } },
  cyclops: { file: "Cyclops_cosplay_at_Anime_Boston_2025-20250523_1558.jpg", focus: { x: 0.5, y: 0.28 } },
  daredevil: { file: "Cosplay_of_Kingpin_and_Daredevil_at_Brussels_Comic_Con_2019_(33424495988).jpg", focus: { x: 0.42, y: 0.3 } },
  falcon: { file: "C2E2_2013_-_The_Falcon_(8689160144).jpg", focus: { x: 0.5, y: 0.28 } },
  loki: { file: "Cosplay_of_Loki_at_the_2021_New_York_Comic_Con_(51574055285).jpg", focus: { x: 0.5, y: 0.28 } },
  groot: { file: "2014_Dragon_Con_Cosplay_-_Groot_(14937100589).jpg", focus: { x: 0.5, y: 0.35 } },
  "she-hulk": { file: "She-Hulk_cosplay_lawyer_suit_NYCC2012.jpg", focus: { x: 0.5, y: 0.28 } },
  "ant-man": { file: "Ant-Man_cosplay.jpg", focus: { x: 0.5, y: 0.28 } },
  "scarlet witch": { file: "Cosplay_of_Scarlet_Witch_at_the_2021_New_York_Comic_Con_(51573366468).jpg", focus: { x: 0.5, y: 0.28 } },
  "captain marvel": { file: "Captain_Marvel_cosplay.jpg", focus: { x: 0.5, y: 0.28 } },
  "star-lord": { file: "Cosplay_of_Star-Lord_at_Brussels_Comic_Con_2019_(46385495555).jpg", focus: { x: 0.5, y: 0.28 } },
  gamora: { file: "Gamora_cosplay.jpg", focus: { x: 0.5, y: 0.28 } },
  magneto: { file: "Cosplay_of_Magneto_at_WonderCon_2012.jpg", focus: { x: 0.5, y: 0.28 } },

  batman: { file: "Batman_Cosplay_at_NYCC_2017.jpg", focus: { x: 0.5, y: 0.28 } },
  superman: { file: "Cosplay_of_Superman_at_Brussels_Comic_Con_2022_(51976380831).jpg", focus: { x: 0.5, y: 0.28 } },
  "wonder woman": { file: "Wonder_Woman_Cosplay_-_Costume_of_New_52.jpg", focus: { x: 0.5, y: 0.28 } },
  joker: { file: "Brussels_Expo_-_Cosplay_of_Joker_1.jpg", focus: { x: 0.5, y: 0.28 } },
  "harley quinn": { file: "Harley_Quinn_Cosplay_at_NYCC_2017.jpg", focus: { x: 0.5, y: 0.28 } },
  aquaman: { file: "NYCC_2013_-_Aquaman_(10311563775).jpg", focus: { x: 0.5, y: 0.28 } },
  cyborg: { file: "SDCC_2012_-_Cyborg_(7573119816).jpg", focus: { x: 0.5, y: 0.28 } },
  catwoman: { file: "Catwoman_Cosplay_1.jpg", focus: { x: 0.5, y: 0.28 } },
  robin: { file: "C2E2_2013_-_Robin_(8701581319).jpg", focus: { x: 0.5, y: 0.28 } },
  "green lantern": { file: "2014_Dragon_Con_Cosplay_-_Steampunk_Green_Lantern_1_(14937518639).jpg", focus: { x: 0.5, y: 0.28 } },
  "the flash": { file: "C2E2_2013_-_Flash_(8702690794).jpg", focus: { x: 0.5, y: 0.28 } },
  nightwing: { file: "Nightwing_cosplay.jpg", focus: { x: 0.5, y: 0.28 } },
  "green arrow": { file: "Green_Arrow_cosplay_(14256547603).jpg", focus: { x: 0.5, y: 0.28 } },
  "poison ivy": { file: "Poison_Ivy_Cosplay.jpg", focus: { x: 0.5, y: 0.28 } },

  minecraft: { file: 'Minecraft_"creeper"_(5146784175).jpg' },
  "pac-man": { file: "Pac-Man_arcade_machine,_De_Notaris_Schaijk.jpg" },
  tetris: { file: "Tetris_on_Game_Boy.jpg" },
  "super mario bros.": { file: "Cosplayer_of_Mario,_Mario_Kart_at_Otakuthon_20160807.jpg", focus: { x: 0.5, y: 0.28 } },
  "mario kart": { file: "Cosplayer_of_Mario,_Mario_Kart_at_Otakuthon_20160807.jpg", focus: { x: 0.5, y: 0.28 } },
  fortnite: { file: "Fortnite_Battle_Royale_at_GDC_2018.jpg" },
  "call of duty": { file: "Call_of_Duty_Modern_Warfare_Gamescom_2019_(48605842367).jpg" },
  "candy crush saga": { file: "Woman_playing_Candy_Crush_Saga_on_iPad.jpg" },
  "halo: combat evolved": { file: "Halo_Master_Chief.webp", focus: { x: 0.5, y: 0.28 } },
  "donkey kong": { file: "Donkey_Kong_arcade.jpg" },
  "sonic the hedgehog": { file: "WW_Chicago_2011_-_Sonic_the_Hedgehog.jpg", focus: { x: 0.5, y: 0.28 } },
  "the legend of zelda": {
    file: "Twilight_Princess_Link_and_Ocarina_of_Time_Zelda_cosplay_at_Anime_Boston_2025_-_20250525_1323.jpg",
    focus: { x: 0.35, y: 0.3 },
  },
  "street fighter ii": { file: "Street_Fighter_II_arcade_machine.jpg" },
  "among us": { file: "Among_Us_cosplay_at_Insomnia_Gaming_Festival_i70_-_April_2023.jpg", focus: { x: 0.5, y: 0.35 } },
  "animal crossing": { file: "WonderCon_2019_-_Isabelle_(Animal_Crossing)_cosplay.jpg", focus: { x: 0.5, y: 0.28 } },

  nike: { file: "Nike_Free+_3_running_shoe.jpg" },
  adidas: { file: "Adidas_Superstar.JPG" },
  "coca-cola": { file: "Coca-Cola_glass_bottle.jpg" },
  pepsi: { file: "Pepsi_Max_can.jpg" },
  apple: { file: "Apple_iPhone.jpg" },
  starbucks: { file: "Starbucks_Grande_Iced_Pumpkin_Spice_Latte.jpg" },
  "mcdonald's": { file: "McDonald's_restaurant,_Breukelen_(2023)_02.jpg" },
  toyota: { file: "Toyota_Corolla.jpg" },
  lego: { file: "Lego_bricks.jpg" },
  ikea: { file: "IKEA_Halifax_2019.jpg" },
  ferrari: { file: "Ferrari_F40.jpg" },
  tesla: { file: "Tesla_Model_S.jpg" },
  disney: { file: "Sleeping_Beauty_Castle_Disneyland_Anaheim_2013.jpg" },
  google: { file: "Google_Campus,_Mountain_View,_CA.jpg" },
  nintendo: { file: "Game-Boy-Original.jpg" },
  bmw: { file: "2020_BMW_4.jpg" },
  "mercedes-benz": { file: "Silver_Mercedes-Benz_E_63_AMG_(S212)_rl.jpg" },

  friends: { file: "Friends_Water_Fountain_(7823224468).jpg" },
  "doctor who": { file: "Cardiff_,_Doctor_Who's_TARDIS_-_geograph.org.uk_-_3914905.jpg" },
  "star trek": {
    file: "USS_Enterprise_star_ship_filming_model_-Star_Trek_-_The_Next_Generation_-_Star_Trek-_Exploring_New_Worlds_Exhibit_at_the_Henry_Ford_Museum,_Dearborn,_Michigan.jpg",
  },

  metropolis: { file: "Metropolis_(1927)_-_Hel.jpg" },
  nosferatu: {
    file: "Max_Schreck_as_Count_Orlok_in_Nosferatu_–_Eine_Symphonie_des_Grauens_(1922).jpg",
  },
  "the kid": { file: "Chaplin_The_Kid.jpg" },
  "the general": { file: "The_General,_front.jpg" },
  "steamboat bill jr.": { file: "Steamboat_Bill_Jr._(1928),_screenshot_4s.jpg" },
  "the gold rush": { file: "The_Gold_Rush_(1925)_-_4.jpg" },
  "the cabinet of dr. caligari": { file: "Publicity_still_for_The_Cabinet_of_Dr._Caligari_(1920)_01.jpg" },
  "battleship potemkin": { file: "Odessastepsboots.jpg" },
  "safety last!": { file: "Harold_et_l'horloge.jpg" },
};

export function licensedPhotoFor(name: string): CatalogImage | null {
  const entry = FILES[name.trim().toLowerCase()];
  if (!entry) {
    return null;
  }
  return commonsImage(entry.file, "Wikimedia Commons", entry.focus);
}

export function hasLicensedPhoto(name: string) {
  return Boolean(FILES[name.trim().toLowerCase()]);
}
