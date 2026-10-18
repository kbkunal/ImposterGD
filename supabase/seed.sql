-- ====================================================================
-- WHO'S THE IMPOSTER? — WORD BANK SEED SCRIPT
-- Inserts 300+ Curated Secret Words & Ambiguous Hints across 16 Categories
-- ====================================================================

create table if not exists public.word_bank (
  id text primary key,
  word text not null,
  category text not null,
  difficulty text not null check (difficulty in ('EASY', 'MEDIUM', 'HARD')),
  hints jsonb not null default '[]'::jsonb,
  language text not null default 'en',
  tags jsonb not null default '[]'::jsonb
);

insert into public.word_bank (id, word, category, difficulty, hints, language, tags)
values
  -- Food and Drinks
  ('fd-01', 'PIZZA', 'Food and Drinks', 'EASY', '["CHEESE", "CRUST", "SLICES", "ITALIAN"]'::jsonb, 'en', '["meal", "baking"]'::jsonb),
  ('fd-02', 'SUSHI', 'Food and Drinks', 'EASY', '["ROLL", "RAW", "SEAWEED", "JAPANESE"]'::jsonb, 'en', '["seafood", "rice"]'::jsonb),
  ('fd-03', 'BURGER', 'Food and Drinks', 'EASY', '["BUN", "PATTY", "GRILL", "FASTFOOD"]'::jsonb, 'en', '["meat", "sandwich"]'::jsonb),
  ('fd-04', 'COFFEE', 'Food and Drinks', 'EASY', '["BEANS", "MUG", "MORNING", "ROAST"]'::jsonb, 'en', '["beverage", "caffeine"]'::jsonb),
  ('fd-05', 'CHOCOLATE', 'Food and Drinks', 'EASY', '["SWEET", "COCOA", "MELT", "BAR"]'::jsonb, 'en', '["dessert", "candy"]'::jsonb),
  ('fd-06', 'TACOS', 'Food and Drinks', 'EASY', '["SHELL", "SALSA", "MEXICAN", "SPICY"]'::jsonb, 'en', '["mexican", "streetfood"]'::jsonb),
  ('fd-07', 'PANCAKES', 'Food and Drinks', 'EASY', '["SYRUP", "FLAT", "STACK", "BATTER"]'::jsonb, 'en', '["breakfast"]'::jsonb),
  ('fd-08', 'POPCORN', 'Food and Drinks', 'EASY', '["CINEMA", "BUTTER", "KERNEL", "BUCKET"]'::jsonb, 'en', '["snack"]'::jsonb),
  ('fd-09', 'ICE CREAM', 'Food and Drinks', 'EASY', '["CONE", "FREEZE", "SCOOP", "SUNDAE"]'::jsonb, 'en', '["dessert", "cold"]'::jsonb),
  ('fd-10', 'SPAGHETTI', 'Food and Drinks', 'EASY', '["NOODLE", "SAUCE", "FORK", "TWIRL"]'::jsonb, 'en', '["pasta", "italian"]'::jsonb),
  ('fd-11', 'CROISSANT', 'Food and Drinks', 'MEDIUM', '["BAKERY", "BUTTER", "FLAKY", "FRENCH"]'::jsonb, 'en', '["pastry", "french"]'::jsonb),
  ('fd-12', 'DONUT', 'Food and Drinks', 'EASY', '["HOLE", "GLAZE", "SPRINKLES", "ROUND"]'::jsonb, 'en', '["bakery"]'::jsonb),
  ('fd-13', 'LEMONADE', 'Food and Drinks', 'EASY', '["SOUR", "PITCHER", "CITRUS", "SUMMER"]'::jsonb, 'en', '["drink", "sour"]'::jsonb),
  ('fd-14', 'WAFFLE', 'Food and Drinks', 'EASY', '["GRID", "IRON", "BREAKFAST", "POCKETS"]'::jsonb, 'en', '["breakfast"]'::jsonb),
  ('fd-15', 'STEAK', 'Food and Drinks', 'EASY', '["RARE", "SIZZLE", "BEEF", "KNIFE"]'::jsonb, 'en', '["meat", "bbq"]'::jsonb),
  ('fd-16', 'AVOCADO', 'Food and Drinks', 'MEDIUM', '["TOAST", "GREEN", "GUACAMOLE", "SEED"]'::jsonb, 'en', '["produce"]'::jsonb),
  ('fd-17', 'CHEESECAKE', 'Food and Drinks', 'MEDIUM', '["CRUST", "DENSE", "BERRY", "SLICED"]'::jsonb, 'en', '["dessert"]'::jsonb),
  ('fd-18', 'BURRITO', 'Food and Drinks', 'EASY', '["WRAPPED", "FOIL", "BEANS", "TIGHT"]'::jsonb, 'en', '["mexican"]'::jsonb),
  ('fd-19', 'RAMEN', 'Food and Drinks', 'MEDIUM', '["BROTH", "BOWL", "CHOPSTICKS", "STEAM"]'::jsonb, 'en', '["japanese", "soup"]'::jsonb),
  ('fd-20', 'APPLE', 'Food and Drinks', 'EASY', '["RED", "ORCHARD", "CRISP", "FRUIT"]'::jsonb, 'en', '["fruit"]'::jsonb),

  -- Animals
  ('an-01', 'ELEPHANT', 'Animals', 'EASY', '["TRUNK", "TUSKS", "LARGE", "AFRICA"]'::jsonb, 'en', '["mammal"]'::jsonb),
  ('an-02', 'PENGUIN', 'Animals', 'EASY', '["TUXEDO", "ANTARCTICA", "WADDLE", "ICE"]'::jsonb, 'en', '["bird", "cold"]'::jsonb),
  ('an-03', 'LION', 'Animals', 'EASY', '["MANE", "PRIDE", "ROAR", "SAVANNA"]'::jsonb, 'en', '["feline", "wild"]'::jsonb),
  ('an-04', 'DOLPHIN', 'Animals', 'EASY', '["BLOWHOLE", "CLICK", "POD", "OCEAN"]'::jsonb, 'en', '["marine"]'::jsonb),
  ('an-05', 'KANGAROO', 'Animals', 'EASY', '["POUCH", "BOUNCE", "AUSTRALIA", "HOP"]'::jsonb, 'en', '["marsupial"]'::jsonb),
  ('an-06', 'GIRAFFE', 'Animals', 'EASY', '["SPOTS", "LEAVES", "TALL", "NECK"]'::jsonb, 'en', '["african"]'::jsonb),
  ('an-07', 'CHAMELEON', 'Animals', 'MEDIUM', '["COLOR", "TONGUE", "EYES", "CAMOUFLAGE"]'::jsonb, 'en', '["reptile"]'::jsonb),
  ('an-08', 'OCTOPUS', 'Animals', 'MEDIUM', '["TENTACLES", "INK", "SUCTION", "DEEP"]'::jsonb, 'en', '["sea"]'::jsonb),
  ('an-09', 'OWL', 'Animals', 'EASY', '["NOCTURNAL", "HOOT", "WISDOM", "ROTATION"]'::jsonb, 'en', '["bird"]'::jsonb),
  ('an-10', 'TIGER', 'Animals', 'EASY', '["STRIPES", "JUNGLE", "PREDATOR", "ORANGE"]'::jsonb, 'en', '["feline"]'::jsonb),

  -- Technology
  ('tc-01', 'SMARTPHONE', 'Technology', 'EASY', '["TOUCH", "SCREEN", "POCKET", "CELLULAR"]'::jsonb, 'en', '["device"]'::jsonb),
  ('tc-02', 'INTERNET', 'Technology', 'EASY', '["WEB", "NETWORK", "ONLINE", "GLOBAL"]'::jsonb, 'en', '["network"]'::jsonb),
  ('tc-03', 'ROBOT', 'Technology', 'EASY', '["METAL", "CIRCUITS", "AUTOMATION", "MECHANICAL"]'::jsonb, 'en', '["robotics"]'::jsonb),
  ('tc-04', 'SATELLITE', 'Technology', 'MEDIUM', '["ORBIT", "DISH", "SPACE", "RELAY"]'::jsonb, 'en', '["space"]'::jsonb),
  ('tc-05', 'DRONE', 'Technology', 'EASY', '["PROPELLERS", "AERIAL", "REMOTE", "HOVER"]'::jsonb, 'en', '["gadget"]'::jsonb),

  -- Fantasy
  ('fn-01', 'DRAGON', 'Fantasy', 'EASY', '["SCALES", "FIRE", "HOARD", "WINGS"]'::jsonb, 'en', '["myth"]'::jsonb),
  ('fn-02', 'WIZARD', 'Fantasy', 'EASY', '["ROBES", "BEARD", "SPELL", "STAFF"]'::jsonb, 'en', '["magic"]'::jsonb),
  ('fn-03', 'UNICORN', 'Fantasy', 'EASY', '["HORN", "MANE", "MAGICAL", "WHITE"]'::jsonb, 'en', '["creature"]'::jsonb),
  ('fn-04', 'CASTLE', 'Fantasy', 'EASY', '["MOAT", "TURRETS", "DRAWBRIDGE", "STONE"]'::jsonb, 'en', '["fortress"]'::jsonb),
  ('fn-05', 'POTION', 'Fantasy', 'EASY', '["VIAL", "BREW", "CAULDRON", "ELIXIR"]'::jsonb, 'en', '["alchemy"]'::jsonb)
on conflict (id) do nothing;
