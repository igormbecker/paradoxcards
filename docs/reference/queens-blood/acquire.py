import concurrent.futures, pathlib, urllib.request
slugs='security-officer riot-trooper levikron grasslands-wolf elphadunk cactuar crystalline-crab titan chocobo-moogle grenadier j-unit-sweeper queen-bee toxirat mu mandragora quetzalcoatl zu devil-rider screamer flan crawler archdragon ogre deathwheel fleetwing zemzelett ignilisk capparwire mindflayer scrutineye hell-rider-ii flametrooper spearhawk sea-devil shoalopod crown-lance tonberry-king sandhog-pie bloatfloat bagnadrana cockatrice heatseeker bomb thug death-claw landworm sandspitter chimera joker amphidex frightflower gagighandi insectoid-chimera gigantoad maloceros grandhorn great-malboro grangalan amalgam skeeskee griffon basilisk reapertail jabberwock desert-sahagin cavestalker stone-golem two-face gi-specter valron disgorgon dragon twin-brain black-bat bahba-velamyu rictus adjudicator yin-yang diabolic-variant special-forces-operator 2-c-soldier-operator kelzmelzer panthera-protector hecteyes floating-death ironclad moss-grown-adamantoise cloud barret tifa aerith red-xiii yuffie cait-sith cid vincent ifrit shiva ramuh kujata odin phoenix leviathan alexander bahamut bahamut-arisen gilgamesh fat-chocobo posh-chocobo moogle-trio magic-pot materia-guardian midgardsormr mythril-golem terror-of-the-deep grasptropod custom-valkyrie gigatrice dyne anuran-suppressor specimen-h1024 crimson-mare-mk-ii gi-nattak forgotten-specimen don-corneo-abzu red-dragon demon-gate reno rude elena tseng rufus roche j-squad chocobo-jockey space-ranger haunted-hotel skywheel loveless saucer-squad dio ultimate-party-animal sephiroth emerald-witch shadowblood-queen'.split()
root=pathlib.Path('docs/reference/queens-blood');(root/'images').mkdir(parents=True,exist_ok=True)
(root/'slugs.txt').write_text('\n'.join(slugs)+'\n')
def get(slug):
 p=root/'images'/f'{slug}.webp'
 if not p.exists(): p.write_bytes(urllib.request.urlopen(f'https://www.queensbloodonline.com/cards/player-{slug}.webp',timeout=30).read())
 return slug
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 results=list(pool.map(get,slugs))
print('Downloaded',len(results),'reference images')
