import json,pathlib,re,difflib,hashlib
from PIL import Image
root=pathlib.Path(__file__).parent
slugs=(root/'slugs.txt').read_text().split()
powers=list(map(int,'''1 3 2 2 4 1 1 5 1 1 2 1 2 1 1 3 2 4 1 2 2 3 5 1 3 1 1 3 1 1 5 3 1 1 1 2 1 1 1 2 3 1 2 4 2 5 3 4 2 2
1 4 2 3 5 3 3 3 1 1 1 2 3 6 3 4 4 3 2 3 3 5 1 2 2 2 1 3 2 2 3 3 3 1 1 1 4 3 4 1 1 3 1 1 2 2 5 3 3 6
3 4 4 4 5 4 3 5 2 1 1 5 6 8 2 5 4 4 4 2 6 5 1 4 4 6 5 2 2 2 1 4 5 2 2 2 1 2 1 3 4 1 4 2 3'''.split()))
assert len(powers)==145,len(powers)
groups=[
('Raise the power of allied cards on affected tiles by 3 while this card is in play.','cactuar zemzelett aerith forgotten-specimen'),
('Raise the power of allied cards on affected tiles by 2 while this card is in play.','crystalline-crab ignilisk spearhawk special-forces-operator magic-pot reno rude haunted-hotel'),
('When played, raise position ranks by 2.','titan disgorgon twin-brain'),
('Raise power by 1 for each other enhanced allied card.','chocobo-moogle'),
('When played, lower the power of enemy cards on affected tiles by 4.','grenadier dragon'),
('When played, lower the power of allied and enemy cards on affected tiles by 3.','toxirat deathwheel ramuh'),
('Raise the power of allied cards on affected tiles by 1 while this card in in play.','mu'),
('When played, add Mandragora Minion to your hand.','mandragora'),
('When played, lower the power of enemy cards on affected tiles by 3.','archdragon hell-rider-ii'),
('When played, lower the power of allied and enemy cards on affected tiles by 1.','capparwire sandspitter jabberwock black-bat floating-death'),
('Lower the power of allied and enemy cards on affected tiles by 1 while this card in in play.','mindflayer'),
('Raise the power of allied and enemy cards on affected tiles by 1 while this card is in play.','scrutineye'),
('When destroyed, lower the power of allied and enemy cards on affected tiles by 3.','flametrooper'),
("When allied cards are played from hand, raise this card's power by 1.",'sea-devil'),
('Raise the power of allied cards on affected tiles by 4 while this card is in play.','shoalopod'),
('When played, lower the power of allied and enemy cards on affected tiles by 2.','crown-lance'),
("When allied cards are destroyed, raise this card's power by 2.",'tonberry-king'),
('When destroyed, raise the power of allied cards on affected tiles by 3.','sandhog-pie hecteyes'),
('When destroyed, lower the power of allied and enemy cards on affected tiles by 4.','bloatfloat bomb'),
("When enemy cards are played from hand, raise this card's power by 1.",'bagnadrana'),
('When played, destroy allied and enemy cards on affected tiles.','cockatrice gigatrice'),
('When destroyed, add Heatseeker Minion to your hand.','heatseeker'),
("When enemy cards are destroyed, raise this card's power by 1.",'death-claw'),
("When enemy cards are destroyed, raise this card's power by 2.",'landworm anuran-suppressor'),
('Raise power by 2 for each enfeebled enemy card.','chimera'),
("When allied and enemy cards are detroyed, raise this card's power by 1.",'joker'),
('The first time this card is enhanced, raise the power of allied cards on affected tiles by 3.','amphidex'),
('When destroyed, raise the power of allied and enemy cards on affected tiles by 2.','frightflower'),
('When first enhanced, lower the power of enemy cards on affected tiles by 2.','gagighandi'),
('Destroy an allied card and replace it.','insectoid-chimera gigantoad grandhorn'),
('When you win the lane, receive a score bonus of 10.','maloceros chocobo-jockey'),
('When played, lower the power of allied and enemy cards on affected tiles by 6.','great-malboro'),
('When played, add Grangalan Junior to your hand.','grangalan'),
('When destroyed, add Resurrected Amalgam to your hand.','amalgam'),
("When allied cards are destroyed, raise this card's power by 1.",'skeeskee'),
("Replace an ally and raise the power of allied cards on affected tiles by the replaced ally's power.",'griffon yin-yang gi-nattak'),
('When played, destroy enemy cards on affected tiles.','basilisk sephiroth'),
('When first enfeebled, lower the power of enemy cards on affected tiles by 2.','reapertail cavestalker red-xiii'),
('When first enfeebled, raise the power of allied cards on affected tiles by 4.','desert-sahagin'),
('When first enhanced, lower the power of enemy cards on affected tiles by 4.','stone-golem'),
('Enhanced: raise power of allied and enemy cards on affected tiles by 4. Enfeebled: lower their power by 4.','two-face'),
("Replace an ally and lower the power of allied and enemy cards on affected tiles by the replaced ally's power.",'gi-specter diabolic-variant kelzmelzer yuffie gilgamesh'),
('Raise power by 2 for each enfeebled allied card.','valron'),
('When destroyed, lower the power of enemy cards on affected tiles by 1.','bahba-velamyu'),
('Raise power by 1 for each enfeebled allied and enemy card.','rictus'),
('Raise power by 1 for each other enhanced or enfeebled allied and enemy card.','adjudicator'),
('Raise the power of allied cards on affected tiles by 3 while this card is in play.','2-c-soldier-operator'),
('The first time this card is enhanced, raise the power of allied cards on affected tiles by 4.','panthera-protector'),
('Raise power by 3 for each enhanced enemy card.','ironclad'),
('When played, raise position ranks by 3.','moss-grown-adamantoise'),
("When this card's power first reaches 7, raise the power of allied cards on affected tiles by 2.",'cloud'),
('When played, lower the power of enemy cards on affected tiles by 8.','barret'),
('When you win the lane, receive a score bonus of 5.','tifa'),
('When played, add Moogle to your hand.','cait-sith'),
('When played, add The Tiny Bronco to your hand.','cid'),
('When destroyed, add Galian Beast to your hand.','vincent'),
('Raise power by 2 for each other enhanced allied card.','ifrit'),
('When played, spawn Diamond Dust of power 2, 4, or 6 in emtpy positions.','shiva'),
('When first enhanced, lower the power of enemy cards on affected tiles by 5.','kujata'),
('Raise power by 2 for each other enhanced enemy card.','odin'),
('When destroyed, raise the power of allied cards on affected tiles by 5.','phoenix'),
('Lower the power of enemy cards on affected tiles by 3 while this card is in play.','leviathan'),
('Raise power by 3 for each other enfeebled allied card.','alexander'),
('When played, lower the power of enemy cards on affected tiles by 5.','bahamut'),
('When played, spawn Elementals--cards that enanche when destroyed--in your empty positions.','bahamut-arisen'),
('Creates a surfeit of positions around it when played.','fat-chocobo'),
('When you win the lane, receive a score bonus of 3.','posh-chocobo'),
('When played, add both Moogle Mage and Moogle Bard to your hand.','moogle-trio'),
('When first enfeebled, lower the power of enemy cards on affected tiles by 6.','materia-guardian'),
("When allied and enemy cards are destroyed, raise this card's power by 1.",'midgardsormr'),
('Possesse a crystal-hard resolve and overwhelming amount of power.','mythril-golem'),
('Lower the power of allied and enemy cards on affected tiles by 1 while this card is in play.','terror-of-the-deep'),
('When first enhanced, lower the power of allied and enemy cards on affected tiles by 4.','grasptropod'),
('When played, lower the power of allied and enemy cards on affected tiles by 4.','custom-valkyrie red-dragon'),
('When played, lower the power of allied and enemy cards on affected tiles by 5.','dyne'),
('Raise the power of allied and enemy cards on affected tiles by 3 while this card is in play.','specimen-h1024'),
('When first enfeebled, lower the power of allied and enemy cards on affected tiles by 5.','crimson-mare-mk-ii'),
('When played, add both Cacneo and Donberry to your hand.','don-corneo-abzu'),
('When destroyed, lower the power of enemy cards on affected tiles by 9.','demon-gate'),
('When first enhanced, lower the power of allied and enemy cards on affected tiles by 99.','elena'),
('The first time this card in enhanced, raise the power of allied cards on affected tiles by 4.','tseng'),
('Creates an intimidatingly large number of positions around him when played.','rufus'),
('When played, lower the power of allied cards on affected tiles by 1.','roche'),
('When played, spawn Hype Johnnys--cards that enhance while in play--in your empty positions.','j-squad'),
('Raise power by 1 for each other enhanced enemy card.','space-ranger'),
('Adds positions in the shape of a certain Gold Saucer attraction.','skywheel'),
('When played, raise the power of allied and enemy cards on affected tiles by 1.','loveless'),
('Make use of its adorable nature to enlive the battlefield.','saucer-squad'),
('Raise power by 1 for each other enhanced allied and enemy card.','dio'),
("If this card is in play when the round ends, the loser of each lane's score is added to the victor's",'ultimate-party-animal'),
('Raise the power of allied and enemy cards on affected tiles by 2 while this card is in play.','emerald-witch'),
('Raise power by 3 for each other enfeebled allied and enemy card.','shadowblood-queen'),
]
abilities={slug:text for text,group in groups for slug in group.split()}
def normalize(s):return re.sub('[^a-z0-9]','',s.lower())
originals=json.loads((root/'original-numbers.json').read_text())
for o in originals:o['name']=re.split(r'–|[- ]+Chapter',o['name'])[0].strip()
by_name={normalize(o['name']):o for o in originals}
alias={'hell-rider-ii':'Hell Rider II','terror-of-the-deep':'Terror of the Deep','levikron':'Levrikon','2-c-soldier-operator':'2-C SOLDIER Operator','yin-yang':'Yin & Yang','crimson-mare-mk-ii':'Crimson Mare Mk. II','don-corneo-abzu':'Don Corneo & Abzu','red-xiii':'Red XIII','gi-nattak':'Gi Nattak','j-squad':'J-Squad','j-unit-sweeper':'J-Unit Sweeper','moss-grown-adamantoise':'Moss-Grown Adamantoise'}
replacements=set('insectoid-chimera gigantoad grandhorn griffon gi-specter yin-yang diabolic-variant kelzmelzer yuffie gilgamesh gi-nattak'.split())
result=[]
for i,slug in enumerate(slugs):
 name=alias.get(slug,slug.replace('-',' ').title());key=normalize(name)
 if key not in by_name:
  match=difflib.get_close_matches(key,by_name,n=1,cutoff=.7)
  assert match,(slug,key)
  key=match[0]
 original=by_name[key]
 im=Image.open(root/'images'/f'{slug}.webp').convert('RGB');assert im.size==(390,534)
 rank=0 if slug in replacements else sum(1 for x in [50,88,126] if (lambda p:p[0]>220 and p[1]>190 and p[2]<205)(im.getpixel((x,42))))
 assert rank in ([0] if slug in replacements else [1,2,3]),(slug,rank)
 expansion=[];effects=[];matrix=[]
 for row in range(5):
  line=[]
  for col in range(5):
   x=144+25*col;y=320+25*row;p=im.getpixel((x,y))
   red=sum(1 for xx in range(x-10,x+11) for yy in range(y-10,y+11) if (lambda p:p[0]>160 and p[0]>p[1]*1.5 and 50<p[1]<155 and p[2]<120)(im.getpixel((xx,yy))))>100
   gold=p[0]>190 and 140<p[1]<210 and p[2]<145
   origin=row==2 and col==2
   if gold:expansion.append([row-2,col-2])
   if red:effects.append([row-2,col-2])
   line.append('O' if origin else 'B' if red and gold else 'E' if red else 'R' if gold else '.')
  matrix.append(''.join(line))
 path=root/'images'/f'{slug}.webp'
 result.append({'id':f'qb-{original["number"]:03d}','originalNumber':original['number'],'nameEn':original['name'],'sourceNameEn':name if slug!='levikron' else 'Levikron','sourceSlug':slug,'power':powers[i],'rank':rank,'placementType':'replacement' if rank==0 else 'rank','expansionOffsets':expansion,'effectOffsets':effects,'pattern5x5':matrix,'abilityTextEn':abilities.get(slug,'This card has no abilities.'),'image':f'images/{slug}.webp','imageUrl':f'https://www.queensbloodonline.com/cards/player-{slug}.webp','imageSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'verification':{'stats':'visually transcribed from source card image','patterns':'extracted from colored cells in source card image','ability':'transcribed from rendered source tooltip','originalNumber':'matched against supplementary original-number reference','originalMechanics':'not independently verified against FFVII Rebirth'}})
assert len({r['id'] for r in result})==145,[(r['id'],r['sourceSlug']) for r in result]
result.sort(key=lambda r:r['originalNumber'])
data={'schemaVersion':1,'capturedOn':'2026-10-21','sourceUrl':'https://www.queensbloodonline.com/decks/','numberingSourceUrl':'https://www.powerpyx.com/final-fantasy-7-vii-rebirth-all-queens-blood-card-locations/','status':'reference capture, not an engine-ready or independently verified ruleset','coordinateConvention':{'origin':[0,0],'offsetFormat':['row','column'],'positiveRow':'down','positiveColumn':'right, toward opponent for left-side player','opponentPerspective':'mirror column offsets','legend':{'O':'card origin','R':'territory/rank expansion','E':'ability affected tile','B':'both expansion and ability','.' :'unaffected'},'note':'All offsets are relative to card origin. An affected tile is not an additional occupied tile; each placed card occupies its origin.'},'cards':result}
(root/'cards.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Saved',len(result),'cards; ranks:',{r:sum(c['rank']==r for c in result) for r in range(4)})
print('No-ability cards:',[c['sourceSlug'] for c in result if c['abilityTextEn']=='This card has no abilities.'])


