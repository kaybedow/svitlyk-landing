# Світлик

Демо лендинг для одного товару: бездротовий світильник з датчиком руху. Бренд і ціни вигадані.

Сайт: https://kaybedow.github.io/svitlyk-landing/

## Що є

- калькулятор: вибираєш кімнати, він сам підбирає найдешевші набори (5, 3, 1 шт)
- знижка 10% на 10 хв через стирашку, таймер не скидається після перезавантаження
- попап замовлення з маскою телефону
- фото відкриваються на весь екран, гортаються свайпом
- події в dataLayer і Facebook Pixel, UTM зберігаються на 30 днів, `?debug=1` показує події в консолі

Заявки йдуть на `LEAD_URL` в `js/main.js`. Зараз там порожньо, форма працює в демо режимі. Для реального сайту туди ставиться свій вебхук, наприклад з [ai-lead-bitrix24](https://github.com/kaybedow/ai-lead-bitrix24). Напряму в Telegram бот з браузера слати не можна, токен буде видно всім.

HTML, CSS і JS без фреймворків.

## Фото і відео

Фото робив у Nano Banana, правки в Photopea, відео в Google Flow.

Спочатку зробив один еталонний кадр товару і додавав його до кожного промпту, інакше світильник на кожному фото виходив різний:

```
Product photo of a slim wireless LED light bar, 30 cm long, matte white plastic body with rounded ends, small motion sensor dot in the center, warm white light glowing from the bottom side, on a pure white background, soft studio light, no text, no logo
```

Приклад промпту для кадру з інтер'єром:

```
Use the attached product exactly as it is. Narrow apartment corridor at night, the light bar is mounted low on the wall, glowing warm light down onto the floor, a path towards a half-open bathroom door. Everything else is dark. Realistic photo, 4:3, no text, no wires
```

Що найчастіше доводилось правити: світло било вгору, хоча світильник світить вниз; в кадрі були зайві лампи і розетки; сходи виходили нереальні, допомогли точні розміри сходинок у промпті.

З відео головне що спрацювало: давати свій перший кадр кухні. Коли давав тільки фото світильника, модель малювала все з нуля і світильники ставали іншими.
