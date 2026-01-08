import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { ChevronDown, Search } from 'lucide-react';

// Complete list of countries with dial codes, patterns and translations (RU, EN, KZ, TR, ES)
const COUNTRIES = [
    // CIS - Popular first
    { code: 'KZ', dialCode: '+7', pattern: 'XXX XXX XX XX', maxLength: 10, nameRu: 'Казахстан', nameEn: 'Kazakhstan', nameKz: 'Қазақстан', nameTr: 'Kazakistan', nameEs: 'Kazajistán' },
    { code: 'RU', dialCode: '+7', pattern: 'XXX XXX XX XX', maxLength: 10, nameRu: 'Россия', nameEn: 'Russia', nameKz: 'Ресей', nameTr: 'Rusya', nameEs: 'Rusia' },
    { code: 'UZ', dialCode: '+998', pattern: 'XX XXX XX XX', maxLength: 9, nameRu: 'Узбекистан', nameEn: 'Uzbekistan', nameKz: 'Өзбекстан', nameTr: 'Özbekistan', nameEs: 'Uzbekistán' },
    { code: 'UA', dialCode: '+380', pattern: 'XX XXX XX XX', maxLength: 9, nameRu: 'Украина', nameEn: 'Ukraine', nameKz: 'Украина', nameTr: 'Ukrayna', nameEs: 'Ucrania' },
    { code: 'BY', dialCode: '+375', pattern: 'XX XXX XX XX', maxLength: 9, nameRu: 'Беларусь', nameEn: 'Belarus', nameKz: 'Беларусь', nameTr: 'Belarus', nameEs: 'Bielorrusia' },
    { code: 'KG', dialCode: '+996', pattern: 'XXX XXX XXX', maxLength: 9, nameRu: 'Кыргызстан', nameEn: 'Kyrgyzstan', nameKz: 'Қырғызстан', nameTr: 'Kırgızistan', nameEs: 'Kirguistán' },
    { code: 'TJ', dialCode: '+992', pattern: 'XX XXX XX XX', maxLength: 9, nameRu: 'Таджикистан', nameEn: 'Tajikistan', nameKz: 'Тәжікстан', nameTr: 'Tacikistan', nameEs: 'Tayikistán' },
    { code: 'TM', dialCode: '+993', pattern: 'XX XXXXXX', maxLength: 8, nameRu: 'Туркменистан', nameEn: 'Turkmenistan', nameKz: 'Түрікменстан', nameTr: 'Türkmenistan', nameEs: 'Turkmenistán' },
    { code: 'AZ', dialCode: '+994', pattern: 'XX XXX XX XX', maxLength: 9, nameRu: 'Азербайджан', nameEn: 'Azerbaijan', nameKz: 'Әзірбайжан', nameTr: 'Azerbaycan', nameEs: 'Azerbaiyán' },
    { code: 'AM', dialCode: '+374', pattern: 'XX XXX XXX', maxLength: 8, nameRu: 'Армения', nameEn: 'Armenia', nameKz: 'Армения', nameTr: 'Ermenistan', nameEs: 'Armenia' },
    { code: 'GE', dialCode: '+995', pattern: 'XXX XX XX XX', maxLength: 9, nameRu: 'Грузия', nameEn: 'Georgia', nameKz: 'Грузия', nameTr: 'Gürcistan', nameEs: 'Georgia' },
    { code: 'MD', dialCode: '+373', pattern: 'XX XXX XXX', maxLength: 8, nameRu: 'Молдова', nameEn: 'Moldova', nameKz: 'Молдова', nameTr: 'Moldova', nameEs: 'Moldavia' },
    // Europe
    { code: 'DE', dialCode: '+49', pattern: 'XXX XXXXXXXX', maxLength: 11, nameRu: 'Германия', nameEn: 'Germany', nameKz: 'Германия', nameTr: 'Almanya', nameEs: 'Alemania' },
    { code: 'GB', dialCode: '+44', pattern: 'XXXX XXXXXX', maxLength: 10, nameRu: 'Великобритания', nameEn: 'United Kingdom', nameKz: 'Ұлыбритания', nameTr: 'Birleşik Krallık', nameEs: 'Reino Unido' },
    { code: 'FR', dialCode: '+33', pattern: 'X XX XX XX XX', maxLength: 9, nameRu: 'Франция', nameEn: 'France', nameKz: 'Франция', nameTr: 'Fransa', nameEs: 'Francia' },
    { code: 'IT', dialCode: '+39', pattern: 'XXX XXX XXXX', maxLength: 10, nameRu: 'Италия', nameEn: 'Italy', nameKz: 'Италия', nameTr: 'İtalya', nameEs: 'Italia' },
    { code: 'ES', dialCode: '+34', pattern: 'XXX XXX XXX', maxLength: 9, nameRu: 'Испания', nameEn: 'Spain', nameKz: 'Испания', nameTr: 'İspanya', nameEs: 'España' },
    { code: 'PT', dialCode: '+351', pattern: 'XXX XXX XXX', maxLength: 9, nameRu: 'Португалия', nameEn: 'Portugal', nameKz: 'Португалия', nameTr: 'Portekiz', nameEs: 'Portugal' },
    { code: 'NL', dialCode: '+31', pattern: 'X XXXXXXXX', maxLength: 9, nameRu: 'Нидерланды', nameEn: 'Netherlands', nameKz: 'Нидерланд', nameTr: 'Hollanda', nameEs: 'Países Bajos' },
    { code: 'BE', dialCode: '+32', pattern: 'XXX XX XX XX', maxLength: 9, nameRu: 'Бельгия', nameEn: 'Belgium', nameKz: 'Бельгия', nameTr: 'Belçika', nameEs: 'Bélgica' },
    { code: 'AT', dialCode: '+43', pattern: 'XXX XXXXXXX', maxLength: 10, nameRu: 'Австрия', nameEn: 'Austria', nameKz: 'Австрия', nameTr: 'Avusturya', nameEs: 'Austria' },
    { code: 'CH', dialCode: '+41', pattern: 'XX XXX XX XX', maxLength: 9, nameRu: 'Швейцария', nameEn: 'Switzerland', nameKz: 'Швейцария', nameTr: 'İsviçre', nameEs: 'Suiza' },
    { code: 'PL', dialCode: '+48', pattern: 'XXX XXX XXX', maxLength: 9, nameRu: 'Польша', nameEn: 'Poland', nameKz: 'Польша', nameTr: 'Polonya', nameEs: 'Polonia' },
    { code: 'CZ', dialCode: '+420', pattern: 'XXX XXX XXX', maxLength: 9, nameRu: 'Чехия', nameEn: 'Czech Republic', nameKz: 'Чехия', nameTr: 'Çekya', nameEs: 'Chequia' },
    { code: 'SK', dialCode: '+421', pattern: 'XXX XXX XXX', maxLength: 9, nameRu: 'Словакия', nameEn: 'Slovakia', nameKz: 'Словакия', nameTr: 'Slovakya', nameEs: 'Eslovaquia' },
    { code: 'HU', dialCode: '+36', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'Венгрия', nameEn: 'Hungary', nameKz: 'Венгрия', nameTr: 'Macaristan', nameEs: 'Hungría' },
    { code: 'RO', dialCode: '+40', pattern: 'XXX XXX XXX', maxLength: 9, nameRu: 'Румыния', nameEn: 'Romania', nameKz: 'Румыния', nameTr: 'Romanya', nameEs: 'Rumanía' },
    { code: 'BG', dialCode: '+359', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'Болгария', nameEn: 'Bulgaria', nameKz: 'Болгария', nameTr: 'Bulgaristan', nameEs: 'Bulgaria' },
    { code: 'GR', dialCode: '+30', pattern: 'XXX XXX XXXX', maxLength: 10, nameRu: 'Греция', nameEn: 'Greece', nameKz: 'Грекия', nameTr: 'Yunanistan', nameEs: 'Grecia' },
    { code: 'HR', dialCode: '+385', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'Хорватия', nameEn: 'Croatia', nameKz: 'Хорватия', nameTr: 'Hırvatistan', nameEs: 'Croacia' },
    { code: 'RS', dialCode: '+381', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'Сербия', nameEn: 'Serbia', nameKz: 'Сербия', nameTr: 'Sırbistan', nameEs: 'Serbia' },
    { code: 'SI', dialCode: '+386', pattern: 'XX XXX XXX', maxLength: 8, nameRu: 'Словения', nameEn: 'Slovenia', nameKz: 'Словения', nameTr: 'Slovenya', nameEs: 'Eslovenia' },
    { code: 'BA', dialCode: '+387', pattern: 'XX XXX XXX', maxLength: 8, nameRu: 'Босния', nameEn: 'Bosnia', nameKz: 'Босния', nameTr: 'Bosna', nameEs: 'Bosnia' },
    { code: 'ME', dialCode: '+382', pattern: 'XX XXX XXX', maxLength: 8, nameRu: 'Черногория', nameEn: 'Montenegro', nameKz: 'Черногория', nameTr: 'Karadağ', nameEs: 'Montenegro' },
    { code: 'MK', dialCode: '+389', pattern: 'XX XXX XXX', maxLength: 8, nameRu: 'С. Македония', nameEn: 'N. Macedonia', nameKz: 'С. Македония', nameTr: 'K. Makedonya', nameEs: 'Macedonia N.' },
    { code: 'AL', dialCode: '+355', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'Албания', nameEn: 'Albania', nameKz: 'Албания', nameTr: 'Arnavutluk', nameEs: 'Albania' },
    { code: 'SE', dialCode: '+46', pattern: 'XX XXX XX XX', maxLength: 9, nameRu: 'Швеция', nameEn: 'Sweden', nameKz: 'Швеция', nameTr: 'İsveç', nameEs: 'Suecia' },
    { code: 'NO', dialCode: '+47', pattern: 'XXX XX XXX', maxLength: 8, nameRu: 'Норвегия', nameEn: 'Norway', nameKz: 'Норвегия', nameTr: 'Norveç', nameEs: 'Noruega' },
    { code: 'DK', dialCode: '+45', pattern: 'XX XX XX XX', maxLength: 8, nameRu: 'Дания', nameEn: 'Denmark', nameKz: 'Дания', nameTr: 'Danimarka', nameEs: 'Dinamarca' },
    { code: 'FI', dialCode: '+358', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'Финляндия', nameEn: 'Finland', nameKz: 'Финляндия', nameTr: 'Finlandiya', nameEs: 'Finlandia' },
    { code: 'IE', dialCode: '+353', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'Ирландия', nameEn: 'Ireland', nameKz: 'Ирландия', nameTr: 'İrlanda', nameEs: 'Irlanda' },
    { code: 'LT', dialCode: '+370', pattern: 'XXX XXXXX', maxLength: 8, nameRu: 'Литва', nameEn: 'Lithuania', nameKz: 'Литва', nameTr: 'Litvanya', nameEs: 'Lituania' },
    { code: 'LV', dialCode: '+371', pattern: 'XXXX XXXX', maxLength: 8, nameRu: 'Латвия', nameEn: 'Latvia', nameKz: 'Латвия', nameTr: 'Letonya', nameEs: 'Letonia' },
    { code: 'EE', dialCode: '+372', pattern: 'XXXX XXXX', maxLength: 8, nameRu: 'Эстония', nameEn: 'Estonia', nameKz: 'Эстония', nameTr: 'Estonya', nameEs: 'Estonia' },
    { code: 'CY', dialCode: '+357', pattern: 'XX XXXXXX', maxLength: 8, nameRu: 'Кипр', nameEn: 'Cyprus', nameKz: 'Кипр', nameTr: 'Kıbrıs', nameEs: 'Chipre' },
    // Turkey & Middle East
    { code: 'TR', dialCode: '+90', pattern: 'XXX XXX XX XX', maxLength: 10, nameRu: 'Турция', nameEn: 'Turkey', nameKz: 'Түркия', nameTr: 'Türkiye', nameEs: 'Turquía' },
    { code: 'AE', dialCode: '+971', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'ОАЭ', nameEn: 'UAE', nameKz: 'БАӘ', nameTr: 'BAE', nameEs: 'EAU' },
    { code: 'SA', dialCode: '+966', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'Сауд. Аравия', nameEn: 'Saudi Arabia', nameKz: 'Сауд Арабиясы', nameTr: 'Suudi Arabistan', nameEs: 'Arabia Saudita' },
    { code: 'QA', dialCode: '+974', pattern: 'XXXX XXXX', maxLength: 8, nameRu: 'Катар', nameEn: 'Qatar', nameKz: 'Катар', nameTr: 'Katar', nameEs: 'Catar' },
    { code: 'KW', dialCode: '+965', pattern: 'XXXX XXXX', maxLength: 8, nameRu: 'Кувейт', nameEn: 'Kuwait', nameKz: 'Кувейт', nameTr: 'Kuveyt', nameEs: 'Kuwait' },
    { code: 'BH', dialCode: '+973', pattern: 'XXXX XXXX', maxLength: 8, nameRu: 'Бахрейн', nameEn: 'Bahrain', nameKz: 'Бахрейн', nameTr: 'Bahreyn', nameEs: 'Baréin' },
    { code: 'OM', dialCode: '+968', pattern: 'XXXX XXXX', maxLength: 8, nameRu: 'Оман', nameEn: 'Oman', nameKz: 'Оман', nameTr: 'Umman', nameEs: 'Omán' },
    { code: 'JO', dialCode: '+962', pattern: 'X XXXX XXXX', maxLength: 9, nameRu: 'Иордания', nameEn: 'Jordan', nameKz: 'Иордания', nameTr: 'Ürdün', nameEs: 'Jordania' },
    { code: 'LB', dialCode: '+961', pattern: 'XX XXX XXX', maxLength: 8, nameRu: 'Ливан', nameEn: 'Lebanon', nameKz: 'Ливан', nameTr: 'Lübnan', nameEs: 'Líbano' },
    { code: 'IL', dialCode: '+972', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'Израиль', nameEn: 'Israel', nameKz: 'Израиль', nameTr: 'İsrail', nameEs: 'Israel' },
    { code: 'EG', dialCode: '+20', pattern: 'XXX XXX XXXX', maxLength: 10, nameRu: 'Египет', nameEn: 'Egypt', nameKz: 'Мысыр', nameTr: 'Mısır', nameEs: 'Egipto' },
    { code: 'IR', dialCode: '+98', pattern: 'XXX XXX XXXX', maxLength: 10, nameRu: 'Иран', nameEn: 'Iran', nameKz: 'Иран', nameTr: 'İran', nameEs: 'Irán' },
    { code: 'IQ', dialCode: '+964', pattern: 'XXX XXX XXXX', maxLength: 10, nameRu: 'Ирак', nameEn: 'Iraq', nameKz: 'Ирак', nameTr: 'Irak', nameEs: 'Irak' },
    // Asia
    { code: 'CN', dialCode: '+86', pattern: 'XXX XXXX XXXX', maxLength: 11, nameRu: 'Китай', nameEn: 'China', nameKz: 'Қытай', nameTr: 'Çin', nameEs: 'China' },
    { code: 'JP', dialCode: '+81', pattern: 'XX XXXX XXXX', maxLength: 10, nameRu: 'Япония', nameEn: 'Japan', nameKz: 'Жапония', nameTr: 'Japonya', nameEs: 'Japón' },
    { code: 'KR', dialCode: '+82', pattern: 'XX XXXX XXXX', maxLength: 10, nameRu: 'Юж. Корея', nameEn: 'South Korea', nameKz: 'Оңтүстік Корея', nameTr: 'Güney Kore', nameEs: 'Corea del Sur' },
    { code: 'IN', dialCode: '+91', pattern: 'XXXXX XXXXX', maxLength: 10, nameRu: 'Индия', nameEn: 'India', nameKz: 'Үндістан', nameTr: 'Hindistan', nameEs: 'India' },
    { code: 'PK', dialCode: '+92', pattern: 'XXX XXXXXXX', maxLength: 10, nameRu: 'Пакистан', nameEn: 'Pakistan', nameKz: 'Пәкістан', nameTr: 'Pakistan', nameEs: 'Pakistán' },
    { code: 'BD', dialCode: '+880', pattern: 'XXXX XXXXXX', maxLength: 10, nameRu: 'Бангладеш', nameEn: 'Bangladesh', nameKz: 'Бангладеш', nameTr: 'Bangladeş', nameEs: 'Bangladés' },
    { code: 'TH', dialCode: '+66', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'Таиланд', nameEn: 'Thailand', nameKz: 'Тайланд', nameTr: 'Tayland', nameEs: 'Tailandia' },
    { code: 'VN', dialCode: '+84', pattern: 'XXX XXX XXXX', maxLength: 10, nameRu: 'Вьетнам', nameEn: 'Vietnam', nameKz: 'Вьетнам', nameTr: 'Vietnam', nameEs: 'Vietnam' },
    { code: 'MY', dialCode: '+60', pattern: 'XX XXXX XXXX', maxLength: 10, nameRu: 'Малайзия', nameEn: 'Malaysia', nameKz: 'Малайзия', nameTr: 'Malezya', nameEs: 'Malasia' },
    { code: 'SG', dialCode: '+65', pattern: 'XXXX XXXX', maxLength: 8, nameRu: 'Сингапур', nameEn: 'Singapore', nameKz: 'Сингапур', nameTr: 'Singapur', nameEs: 'Singapur' },
    { code: 'ID', dialCode: '+62', pattern: 'XXX XXXX XXXX', maxLength: 11, nameRu: 'Индонезия', nameEn: 'Indonesia', nameKz: 'Индонезия', nameTr: 'Endonezya', nameEs: 'Indonesia' },
    { code: 'PH', dialCode: '+63', pattern: 'XXX XXX XXXX', maxLength: 10, nameRu: 'Филиппины', nameEn: 'Philippines', nameKz: 'Филиппин', nameTr: 'Filipinler', nameEs: 'Filipinas' },
    { code: 'HK', dialCode: '+852', pattern: 'XXXX XXXX', maxLength: 8, nameRu: 'Гонконг', nameEn: 'Hong Kong', nameKz: 'Гонконг', nameTr: 'Hong Kong', nameEs: 'Hong Kong' },
    { code: 'TW', dialCode: '+886', pattern: 'XXX XXX XXX', maxLength: 9, nameRu: 'Тайвань', nameEn: 'Taiwan', nameKz: 'Тайвань', nameTr: 'Tayvan', nameEs: 'Taiwán' },
    { code: 'MN', dialCode: '+976', pattern: 'XX XX XXXX', maxLength: 8, nameRu: 'Монголия', nameEn: 'Mongolia', nameKz: 'Моңғолия', nameTr: 'Moğolistan', nameEs: 'Mongolia' },
    { code: 'AF', dialCode: '+93', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'Афганистан', nameEn: 'Afghanistan', nameKz: 'Ауғанстан', nameTr: 'Afganistan', nameEs: 'Afganistán' },
    // Americas
    { code: 'US', dialCode: '+1', pattern: '(XXX) XXX-XXXX', maxLength: 10, nameRu: 'США', nameEn: 'USA', nameKz: 'АҚШ', nameTr: 'ABD', nameEs: 'EE.UU.' },
    { code: 'CA', dialCode: '+1', pattern: '(XXX) XXX-XXXX', maxLength: 10, nameRu: 'Канада', nameEn: 'Canada', nameKz: 'Канада', nameTr: 'Kanada', nameEs: 'Canadá' },
    { code: 'MX', dialCode: '+52', pattern: 'XX XXXX XXXX', maxLength: 10, nameRu: 'Мексика', nameEn: 'Mexico', nameKz: 'Мексика', nameTr: 'Meksika', nameEs: 'México' },
    { code: 'BR', dialCode: '+55', pattern: 'XX XXXXX XXXX', maxLength: 11, nameRu: 'Бразилия', nameEn: 'Brazil', nameKz: 'Бразилия', nameTr: 'Brezilya', nameEs: 'Brasil' },
    { code: 'AR', dialCode: '+54', pattern: 'XX XXXX XXXX', maxLength: 10, nameRu: 'Аргентина', nameEn: 'Argentina', nameKz: 'Аргентина', nameTr: 'Arjantin', nameEs: 'Argentina' },
    { code: 'CL', dialCode: '+56', pattern: 'X XXXX XXXX', maxLength: 9, nameRu: 'Чили', nameEn: 'Chile', nameKz: 'Чили', nameTr: 'Şili', nameEs: 'Chile' },
    { code: 'CO', dialCode: '+57', pattern: 'XXX XXX XXXX', maxLength: 10, nameRu: 'Колумбия', nameEn: 'Colombia', nameKz: 'Колумбия', nameTr: 'Kolombiya', nameEs: 'Colombia' },
    { code: 'PE', dialCode: '+51', pattern: 'XXX XXX XXX', maxLength: 9, nameRu: 'Перу', nameEn: 'Peru', nameKz: 'Перу', nameTr: 'Peru', nameEs: 'Perú' },
    { code: 'VE', dialCode: '+58', pattern: 'XXX XXX XXXX', maxLength: 10, nameRu: 'Венесуэла', nameEn: 'Venezuela', nameKz: 'Венесуэла', nameTr: 'Venezuela', nameEs: 'Venezuela' },
    { code: 'CU', dialCode: '+53', pattern: 'X XXX XXXX', maxLength: 8, nameRu: 'Куба', nameEn: 'Cuba', nameKz: 'Куба', nameTr: 'Küba', nameEs: 'Cuba' },
    // Africa
    { code: 'ZA', dialCode: '+27', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'ЮАР', nameEn: 'South Africa', nameKz: 'ОАР', nameTr: 'Güney Afrika', nameEs: 'Sudáfrica' },
    { code: 'NG', dialCode: '+234', pattern: 'XXX XXX XXXX', maxLength: 10, nameRu: 'Нигерия', nameEn: 'Nigeria', nameKz: 'Нигерия', nameTr: 'Nijerya', nameEs: 'Nigeria' },
    { code: 'KE', dialCode: '+254', pattern: 'XXX XXX XXX', maxLength: 9, nameRu: 'Кения', nameEn: 'Kenya', nameKz: 'Кения', nameTr: 'Kenya', nameEs: 'Kenia' },
    { code: 'MA', dialCode: '+212', pattern: 'XXX XXX XXX', maxLength: 9, nameRu: 'Марокко', nameEn: 'Morocco', nameKz: 'Марокко', nameTr: 'Fas', nameEs: 'Marruecos' },
    { code: 'TN', dialCode: '+216', pattern: 'XX XXX XXX', maxLength: 8, nameRu: 'Тунис', nameEn: 'Tunisia', nameKz: 'Тунис', nameTr: 'Tunus', nameEs: 'Túnez' },
    { code: 'DZ', dialCode: '+213', pattern: 'XXX XX XX XX', maxLength: 9, nameRu: 'Алжир', nameEn: 'Algeria', nameKz: 'Алжир', nameTr: 'Cezayir', nameEs: 'Argelia' },
    { code: 'GH', dialCode: '+233', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'Гана', nameEn: 'Ghana', nameKz: 'Гана', nameTr: 'Gana', nameEs: 'Ghana' },
    { code: 'ET', dialCode: '+251', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'Эфиопия', nameEn: 'Ethiopia', nameKz: 'Эфиопия', nameTr: 'Etiyopya', nameEs: 'Etiopía' },
    // Oceania
    { code: 'AU', dialCode: '+61', pattern: 'XXX XXX XXX', maxLength: 9, nameRu: 'Австралия', nameEn: 'Australia', nameKz: 'Австралия', nameTr: 'Avustralya', nameEs: 'Australia' },
    { code: 'NZ', dialCode: '+64', pattern: 'XX XXX XXXX', maxLength: 9, nameRu: 'Н. Зеландия', nameEn: 'New Zealand', nameKz: 'Жаңа Зеландия', nameTr: 'Yeni Zelanda', nameEs: 'Nueva Zelanda' },
];

// Flag image component using flagcdn.com (reliable CDN)
const FlagIcon = ({ code, className }) => (
    <img
        src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
        srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
        alt=""
        className={cn("inline-block object-cover rounded-sm", className)}
        style={{ width: '24px', height: '18px' }}
        loading="lazy"
    />
);

// Format phone number according to country pattern
const formatPhone = (digits, pattern) => {
    if (!digits) return '';
    let result = '';
    let digitIndex = 0;

    for (let i = 0; i < pattern.length && digitIndex < digits.length; i++) {
        if (pattern[i] === 'X') {
            result += digits[digitIndex];
            digitIndex++;
        } else {
            result += pattern[i];
        }
    }

    return result;
};

// Detect country from existing phone number
const detectCountryFromPhone = (phone) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');

    const sorted = [...COUNTRIES].sort((a, b) =>
        b.dialCode.replace('+', '').length - a.dialCode.replace('+', '').length
    );

    for (const country of sorted) {
        const code = country.dialCode.replace('+', '');
        if (digits.startsWith(code)) {
            return country;
        }
    }
    return null;
};

// Extract local number from full phone
const extractLocalNumber = (phone, dialCode) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    const code = dialCode.replace('+', '');
    if (digits.startsWith(code)) {
        return digits.substring(code.length);
    }
    return digits;
};

export const PhoneInput = ({
    value,
    onChange,
    placeholder,
    className,
    defaultCountry = 'KZ'
}) => {
    const { language } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(() => {
        const detected = detectCountryFromPhone(value);
        if (detected) return detected;
        return COUNTRIES.find(c => c.code === defaultCountry) || COUNTRIES[0];
    });
    const [localNumber, setLocalNumber] = useState(() => {
        if (value && selectedCountry) {
            return extractLocalNumber(value, selectedCountry.dialCode);
        }
        return '';
    });
    const [detectedCountry, setDetectedCountry] = useState(null);

    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    const searchInputRef = useRef(null);
    const triggerRef = useRef(null); // Reference for the dropdown toggle button

    // Get country name based on current language
    const getCountryName = (country) => {
        switch (language) {
            case 'en': return country.nameEn;
            case 'kz': return country.nameKz;
            case 'tr': return country.nameTr;
            case 'es': return country.nameEs;
            default: return country.nameRu;
        }
    };

    // Detect country by IP on mount
    useEffect(() => {
        if (!value) {
            const detectGeo = async () => {
                try {
                    const response = await fetch('https://ipapi.co/json/', {
                        signal: AbortSignal.timeout(3000)
                    });
                    const data = await response.json();
                    const country = COUNTRIES.find(c => c.code === data.country_code);
                    if (country) {
                        setDetectedCountry(country);
                        setSelectedCountry(country);
                    }
                } catch (error) {
                    // Silently fail
                }
            };
            detectGeo();
        }
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Filter countries by search
    const filteredCountries = COUNTRIES.filter(country => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            country.nameRu.toLowerCase().includes(s) ||
            country.nameEn.toLowerCase().includes(s) ||
            country.nameKz.toLowerCase().includes(s) ||
            country.dialCode.includes(s) ||
            country.code.toLowerCase().includes(s)
        );
    });

    // Sort: detected country first, then alphabetically
    const sortedCountries = [...filteredCountries].sort((a, b) => {
        if (detectedCountry) {
            if (a.code === detectedCountry.code) return -1;
            if (b.code === detectedCountry.code) return 1;
        }
        return getCountryName(a).localeCompare(getCountryName(b), language === 'en' ? 'en' : 'ru');
    });

    const handleCountrySelect = (country) => {
        setSelectedCountry(country);
        setIsOpen(false);
        setSearch('');
        const newFullPhone = country.dialCode + localNumber;
        onChange?.(newFullPhone);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handlePhoneChange = (e) => {
        const input = e.target.value;
        const digits = input.replace(/\D/g, '').substring(0, selectedCountry.maxLength);
        setLocalNumber(digits);
        const fullPhone = selectedCountry.dialCode + digits;
        onChange?.(fullPhone);
    };

    const formattedNumber = formatPhone(localNumber, selectedCountry.pattern);

    return (
        <div className={cn("relative", className)} ref={dropdownRef}>
            <div className="flex">
                {/* Country selector button */}
                <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 border border-r-0 rounded-l-md bg-muted/50 hover:bg-muted transition-colors shrink-0 group"
                    onClick={() => setIsOpen(!isOpen)}
                    ref={triggerRef}
                >
                    <div className="flex items-center gap-2">
                        <FlagIcon code={selectedCountry.code} />
                        <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors", isOpen && "rotate-180")} />
                </button>

                {/* Phone input */}
                <input
                    ref={inputRef}
                    type="tel"
                    value={formattedNumber}
                    onChange={handlePhoneChange}
                    placeholder={placeholder || selectedCountry.pattern.replace(/X/g, '0')}
                    className="flex-1 px-3 py-2 border rounded-r-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-0"
                />
            </div>

            {/* Country dropdown */}
            {isOpen && (
                <div className="absolute left-0 z-50 w-80 mt-1 bg-background border rounded-lg shadow-xl overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b bg-muted/30">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={language === 'en' ? 'Search country...' : language === 'kz' ? 'Елді іздеу...' : 'Поиск страны...'}
                                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    {/* Country list */}
                    <div className="overflow-y-auto max-h-64">
                        {sortedCountries.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                {language === 'en' ? 'No countries found' : language === 'kz' ? 'Ел табылмады' : 'Ничего не найдено'}
                            </div>
                        ) : (
                            sortedCountries.map((country) => (
                                <button
                                    key={country.code + country.dialCode}
                                    type="button"
                                    onClick={() => handleCountrySelect(country)}
                                    className={cn(
                                        "w-full flex items-center px-4 py-2.5 text-left hover:bg-muted/70 transition-colors",
                                        selectedCountry.code === country.code && selectedCountry.dialCode === country.dialCode && "bg-primary/10",
                                        detectedCountry?.code === country.code && "border-l-2 border-primary"
                                    )}
                                >
                                    {/* Country name - left aligned */}
                                    <span className="flex-1 text-sm truncate">{getCountryName(country)}</span>

                                    {/* Dial code - right aligned */}
                                    <span className="text-sm text-muted-foreground tabular-nums w-16 text-right">{country.dialCode}</span>

                                    {/* Flag - far right */}
                                    <div className="w-8 ml-2 flex justify-center">
                                        <FlagIcon code={country.code} />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhoneInput;
