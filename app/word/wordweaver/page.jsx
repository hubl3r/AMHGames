"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─── Word list (3000+ common English words, 3-10 letters) ────────────────────
const WORD_LIST = `ace act add age ago aid aim air ale all ant ape apt arc are ark arm art ash ask asp ate awe axe aye bad bag ban bar bat bay bed beg bet bid big bit bog boo bop bow box boy bud bug bun bus but buy cab can cap car cat cod cog cop cot cow cry cub cup cur cut dab dam dew did dig dim dip doe dog dot dry dub due dug dun duo ear eat egg ego elf elk elm emu end era eve ewe eye fad fan far fat fax fed fee fen few fib fig fin fit fix fly foe fog fop for fox fry fun fur gag gap gas gay gel gem get gig gin god got gum gun gut guy gym had hag ham has hat hay hen hew hex hid him hip his hit hog hop hot how hub hug hum hut ice icy ill imp ink ion ire ivy jab jag jam jar jaw jay jet jig job jot joy jug jut keg kin kit lab lap law lax lay lea led leg let lid lip lit log lot low lug mad map mar mat maw may mob mod mop mow mud mug nab nag nap nit nob nod nor not nun oak oar oat odd ode off oil old one opt orb ore our out owe owl own pad pal pan par pat paw pay pea peg pen pep per pet pew pie pig pin pit pod pop pot pow pro pry pub pun pup pus put rag ram ran rap rat raw ray red ref rep rev rid rig rip rob rod rot row rub rug rum run rut rye sad sag sap sat saw say sea set sew sex shy sin sip sir sis sit ski sky sob sod son sow soy spy sty sub sue sum sun tab tan tar tax tea ten tie tin tip toe ton top toy try tub tug tun urn use van vat vex via vie vim vow wad wag war was wax way web wed woe wok won woo wow yak yam yap yaw yes yet yew you zap zip zoo able acid aged also arch area army arts aunt away axle back bake bald ball band bank bare bark barn base bash bath bead beam bean bear beat beef been bell belt bend best bird bite blew blob blow blue blur boar boat body bold bolt bomb bone book boom born both bowl bulk bull burn bush busy cafe cage cake call calm came camp card care cart case cash cast cave cell cent chip chop chow cite city clam clap claw clay clip clod clog clot clue coal coat coil coin cold colt come cone cook cool cope cord core corn cost coup cove cozy crab cram crew crop crow cube cult cure curl cute damp dare dark data date dawn dead deaf deal dean deck deed deem deep deft deli demo deny desk dial dice dill dime dire disk dive dock dome done dose dote dove down drab drag draw drip drop drum dual dude duel dull dump dune dusk dust each earl earn ease east edge else emit envy epic even ever exam face fact fade fail fair fall fame fang fare farm fast fate fawn fear feat feed feel feet fell felt fend fern fill film find fire firm fish fist flag flak flap flat flaw fled flit flop flow foam foil fold fond font food foot fore fork form fort foul four fowl fray free fret fuel full fume fund funk fuss gain gale gall gape gash gate gave gear gent germ glee glen glue gnat goal gold golf good gore gown grab gram gray grew grim grin grip grit grow grub gulf gull gulp gush gust hack hail hale hall halo halt hand hang hard hare harm harp hash hate haul have hawk head heal heap hear heat heel heft held helm help herb herd here hero hill hind hint hire hoax hold hole home hood hook hoop hope horn host hour hump hunt hurl hurt hymn icon idle inch into iron isle itch item jack jade jail jerk jest jolt junk just keen keep kink kiss knob knot know lace lack lain lake lame lamp land lane lard lark lash last late lava lawn lead leaf leak lean lend lens less lest levy lime limp line lion lisp list live load loam loan lock loft lone look loom loon loop lore lose loss loud love luck lull lure lurk lust mace made mail main make male mall malt mama mane many mare mark maze meal mean meat melt memo mend mesh mild mill mine mink mint miss mist moan moat mock mode mole molt more most move much muse musk must nail name nape navy need nest news next nice nick nine node none norm nose note noun null numb obey odds once only open opus oval oven over pace pack pact page paid pain pale palm pane park part pass past path pave peak peal pear peel peer pelt perk pick pike pile pill pine pink pipe plan play plea plod plot plow ploy plum plus poem poet poke pole poll polo pond pool pore pork port pose posh post pour pray prey prod prop pull pulp pump pure push race rage raid rail rain rake ramp rang rank rant rare rash rate rave read real reap reed reef reel rely rend rent rest rice rich ride rift ring riot rise risk roam roar robe rock role roll roof rook room root rope rose rosy rove rude rule rune rush rust safe sage sake sale salt same sand sane sang sank save scan scar shed shoe shop shot show shun shut sick side sigh sign silk sill silt sink site size skid skin skip slab slam slap sled slim slip slit slob slop slow slug slum slur snap snob snow soak sock soft soil sole some song soon sort soul soup sour span spin spit spot spry spur stab stag star stay stem step stew stir stop stow stub stud such suit sulk sung sunk sure surf swam swap swat swim swum tack tale talk tall tame tape tart task taut teak teal team tear tell tend tent term test text than that them then they thin tide till tilt time tint tire toad toil toll tomb tome tone tool torn toss tote tour town tram trap tray tree trim trio trip trot true tube tuft tusk twin type ugly unit upon used vain vale vane vary vast veil vend vent verb veto vice view vile vine void vole volt vote wage wail wait wake walk wall want ward warn warp wart wave weak weal wean wear weed week well welt went were west what when whim whip wide wile will wilt wily wimp wine wing wink wire wise wish wisp with woke wolf womb wood wool word wore work worm worn wrap wren yell yore your zero zone zoom about above abuse after again agree ahead alarm alive alone along alter amaze amble amend amuse angel anger angry ankle annex annoy apply apron ardor arena argue arise armor aroma arose array aside atlas atone attic audio audit augur avoid awake award aware awful badly basic baste batch bayou beach began beige belle bench berry birth bison blade blame bland blank blare blaze bleed bless blind bliss block blood blown board boast bonus booby booth booze botch brave brawn braze break briar bribe bride brief brine bring broad broom broth brown brawl brisk broke broil brood brush buddy budge buggy built bulge bunch bunny buyer cabin camel candy carol carry caste catch cause cedar chant charm chart chase cheap check cheek chess chest chief child chili chill chimp china chink churn civil claim clamp clang clash clasp class clean cleat cleft clerk click clink close cloth cloud clout clove cluck clung coach cocoa comet comic coral couch could count court cover covet craft crave crawl crazy cream crest crisp cross crowd cruel cubic curly curry cycle daddy dairy dance decay decoy defer deity delta depot derby dirty disco dizzy dogma dotty dowry drape drawl dread dream drift drill drive droll drone drool droop drove drusy dryer duchy dusky dusty dwarf dwelt eager eagle early easel eaten eight elite elude embalm embed emend enter equal erode erupt essay evoke exact exult fable facet fairy false fancy farce fatty feast fewer fiery fifty fight filth finch fjord fizzy flail flame flank flask flair flaky flock flood floor flora floss flout flown flute foggy foray forge forth found frail franc frank fraud fresh friar frisk froth froze fruit fungi funky furry gamut gauze gavel giddy girly given gizmo glass glint gloat globe gloom gloss glove gnarly goggle golly gouge graft grain groan grope grout grove growl gruel gruff grunt guile guise gusto gully gummy gypsy happy harpy harsh hasty heady heist hence herby hippo hitch hoist holly honey honor hotel hound howdy humid husky hydra idyll imply inane index inept infer inlet input inter intro inure irony itchy ivory jaded jaggy jaunt jazzy jelly jerky jiffy jumbo jumpy juicy knave kneel knelt knife knock knoll kudos lance lardy latch later leafy leapt leary legal lemur lemon liege limbo lingo lobby logic loony loopy lorry lowly lucky lusty lyric magic manly maple march marry marsh matey maxim mealy melon mercy meter milky mimic mirth moist moldy money month moody moose mourn mouth muddy muggy mulch mummy murky musty myrrh nanny nasty natty needy never newly nicer nippy noble noisy north notch novel nudge nurse nutty nymph occur oddly offer often olive optic orbit order otter ought outdo outer paddy pagan paint pansy papal party patchy patio paved peach penny perky petty piano picky piggy pilot pinch pinky pitch pixel pizza plaid plain plait plume plump plunk plush poach point pokey polio polka poppy porky potty pouty prank psalm puffy pulpy pupil purse query quill quirk quota quote rabid radar randy rapid raven raspy ratio ready realm rebel reedy relax relay relic repay repel resin retry rhino rigor risky rival rivet roomy rough rowdy royal ruddy rugby ruler runny rusty sadly sassy saucy scamp scant scary scene scone scoop score scorn scout scowl scuff seedy seize serve seven shard share shark sharp sheer shelf shell shift shire shirt showy silky silly sinew siren sixth sixty sized slimy slunk slyly smart smear smile smirk smite smoky snaky snare sneak sneer snide snowy snuck soggy solar solve sorry soupy spank spare spark spasm spawn speck spend spiel spike spill spiny spoof spook spool spray spree sprig squat stack staff stale stall stamp stand stank stare stark start state steam steel steep steer stern stick stiff still sting stink stoic stomp stony stood stoop store stork stout stray strip strum strut study stump stung stunk style suave sugar sulky sunny super surge surly swamp swear sweet swept swoop sword tabby taffy talon tango tasty taunt tawny tempo tense tepid terse thick think thorn those throb thrum tiara tidal tiger timid tipsy tired title tizzy tonal topsy total totem toxic track trade trail train tramp traps trawl tread trend trice trick tried trove truly truss trust twain twang twice twirl twist tying udder unfit unify unite unmet until urban usher usual usurp utter vague valid valor value valve vapid vault veiny verge verse vicar video vigil viral vixen vivid vocal vogue wacky waltz warty waste weary weave wedge weedy weird welly wetly while whiff whirl whole whose widen wield windy wispy witty woozy wordy world wormy worst wrack wrath wreak wreck wring wrist wrote yacht yearn yummy zippy zonal absent absorb accent accept access accord accuse across acting actual adjust admire advice afford afraid agenda ageing agreed agrees allows almost alpine always amused anchor answer appear arctic artist assist assume astute attack attend august autumn avenge beware beyond bicker bigger blight blithe blotch blouse blossom bounty bowler breeze bridge bright brooch brutal bucket buckle bundle butter button candid canopy career castle cereal charge choice chosen chrome churns chunky cinder cipher circle citrus classy clever client clover coarse cobalt coffee colony combat common compel comply coward create credit crisis crisis crispy cruise crumble custom darken daylit deadly decade decent deeply define degree deluge demure desert desire devote devout differ direct divest doctor dotted doubly dragon dreamy driven efface effect embark empire endure energy engage enjoy enough ensure equate escape excite exotic expert expose extend extern fading fallen famine fathom feeder feisty feline fierce finger fierce fonder forest formal forsake fossil foster freely frozen future garden garlic garnet gentle gifted global goblin goblet golden gothic grassy greedy grieve grovel growth guided guilty gutter hammer hamper happen hardly hatful health hearth hidden higher hunter hustle ignite immune import indeed infuse insect inside intake invent island itself keeper lacked latent latch latest launch lavish lender lesser likely listen lively living lonely lowkey lumber lustre magnet manner marble meadow member middle mirror modern modest moment mortal mortal mosaic mulberry muscle nation native nature nearly nettle newish newest nimble object oblique obtain offset online oppose ordeal orient origin orphan outlaw output oxford parrot patent patter pencil people pepper permit player plenty pocket polite portal posted praise prayer prince profit prompt proper proud proven proven public pumped purple pursue rabbit racing racial radial random rarely rather rattle really reason recent recipe reduce refill reform refuge region regret relate relent repair report result return reveal reward riddle rising robust rotate rugged rustle sacred safely sailor sample saying scarce scheme school scrape screen secret select settle shadow simple single slight smooth social source spirit spoken spoken sponge spoken spring sprite stable static stolen strife string stripe strong strong struck stroll submit subtle summer summit sunken sunset supply surely taking talent tartan tender tendon tenure theory timber tissue toggle topple torent trowel tunnel turban turtle twig uneven unless unruly uplift useful useless valley valued vanish vanity varied vastly vendor verbal victim violet violet vision vivify warden warmth weapon weekly weight window wonder warden worthy wreath yearly yellow`;

function buildTrie(wordList) {
  const trie = {};
  for (const word of wordList.trim().split(/\s+/)) {
    if (word.length < 3) continue;
    let node = trie;
    for (const ch of word) {
      if (!node[ch]) node[ch] = {};
      node = node[ch];
    }
    node.$ = true;
  }
  return trie;
}

function isValidWord(trie, word) {
  if (word.length < 3) return false;
  let node = trie;
  for (const ch of word.toLowerCase()) {
    if (!node[ch]) return false;
    node = node[ch];
  }
  return !!node.$;
}

// ─── Letter frequency pool ────────────────────────────────────────────────────
const LETTER_POOL = (
  "EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIOOOOOOOONNNNNNSSSSSSTTTTTTRRRRRRLLLLLUUUUDDDDGGG" +
  "BBCCMMPPFFHHVVWWYYKJXQZ"
).split("");

const LETTER_VALUES = {
  A:1,E:1,I:1,O:1,U:1,N:1,R:1,S:1,T:1,L:1,
  D:2,G:2,B:3,C:3,M:3,P:3,
  F:4,H:4,V:4,W:4,Y:4,
  K:5,J:8,X:8,Q:10,Z:10,
};

const GRID_W = 7;
const GRID_H = 7;

const TNORMAL = "normal";
const TGOLD   = "gold";
const TDIA    = "diamond";
const TFIRE   = "fire";

let _idCtr = 0;
function makeTile(letter, type = TNORMAL) {
  return { letter, type, id: ++_idCtr };
}
function randLetter() {
  return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
}
function makeGrid() {
  return Array(GRID_H).fill(null).map(() =>
    Array(GRID_W).fill(null).map(() => makeTile(randLetter()))
  );
}

function isAdjacent(a, b) {
  return Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1 && !(a.r === b.r && a.c === b.c);
}

function scoreWord(path, grid) {
  let base = 0;
  for (const { r, c } of path) {
    const tile = grid[r][c];
    const val = LETTER_VALUES[tile.letter] || 1;
    const mult = tile.type === TDIA ? 3 : tile.type === TGOLD ? 2 : 1;
    base += val * mult;
  }
  const len = path.length;
  const lb = len >= 8 ? 5 : len >= 6 ? 3 : len >= 5 ? 2 : len >= 4 ? 1.5 : 1;
  return Math.round(base * lb);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WordWeaver() {
  const trie = useMemo(() => buildTrie(WORD_LIST), []);

  const [grid,        setGrid]        = useState(makeGrid);
  const [selected,    setSelected]    = useState([]);
  const [score,       setScore]       = useState(0);
  const [wordCount,   setWordCount]   = useState(0);
  const [lastWord,    setLastWord]    = useState("");
  const [message,     setMessage]     = useState(null); // {text, type}
  const [gameOver,    setGameOver]    = useState(false);
  const [started,     setStarted]     = useState(false);
  const [popSet,      setPopSet]      = useState(new Set());

  const msgTimer = useRef(null);

  const showMsg = useCallback((text, type) => {
    clearTimeout(msgTimer.current);
    setMessage({ text, type });
    msgTimer.current = setTimeout(() => setMessage(null), 1800);
  }, []);

  const currentWord = selected.map(({ r, c }) => grid[r][c].letter).join("");
  const wordIsValid = currentWord.length >= 3 && isValidWord(trie, currentWord.toLowerCase());

  // ── Tile click ────────────────────────────────────────────────────────────
  const handleTileClick = useCallback((r, c) => {
    if (gameOver) return;
    setSelected(prev => {
      const already = prev.findIndex(s => s.r === r && s.c === c);
      if (already !== -1) {
        return already === prev.length - 1 ? prev.slice(0, -1) : prev;
      }
      if (prev.length > 0 && !isAdjacent(prev[prev.length - 1], { r, c })) return prev;
      return [...prev, { r, c }];
    });
  }, [gameOver]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const submitWord = useCallback(() => {
    if (selected.length < 3) { showMsg("Too short!", "bad"); return; }
    const word = selected.map(({ r, c }) => grid[r][c].letter).join("").toLowerCase();
    if (!isValidWord(trie, word)) { showMsg(`"${word.toUpperCase()}" — not a word`, "bad"); return; }

    const pts = scoreWord(selected, grid);
    const newWc = wordCount + 1;

    // Animate pop
    const removedIds = new Set(selected.map(({ r, c }) => grid[r][c].id));
    setPopSet(removedIds);
    setTimeout(() => setPopSet(new Set()), 320);

    // Collapse columns & refill
    const removedPos = new Set(selected.map(({ r, c }) => `${r},${c}`));
    const newGrid = grid.map(row => row.map(t => ({ ...t })));

    for (let c = 0; c < GRID_W; c++) {
      const kept = [];
      for (let r = 0; r < GRID_H; r++) {
        if (!removedPos.has(`${r},${c}`)) kept.push(newGrid[r][c]);
      }
      const fill = GRID_H - kept.length;
      for (let i = 0; i < fill; i++) {
        const letter = randLetter();
        const roll = Math.random();
        const type = word.length >= 7 && roll < 0.18 ? TDIA
                   : word.length >= 5 && roll < 0.28 ? TGOLD
                   : TNORMAL;
        kept.unshift(makeTile(letter, type));
      }
      for (let r = 0; r < GRID_H; r++) newGrid[r][c] = kept[r];
    }

    // Fire advancement every 4 words
    let over = false;
    if (newWc % 4 === 0) {
      // Check if any fire is already at row 0
      for (let c = 0; c < GRID_W; c++) {
        if (newGrid[0][c].type === TFIRE) { over = true; break; }
      }
      if (!over) {
        // Move existing fire up
        for (let r = 0; r < GRID_H - 1; r++) {
          for (let c = 0; c < GRID_W; c++) {
            if (newGrid[r + 1][c].type === TFIRE && newGrid[r][c].type !== TFIRE) {
              newGrid[r][c] = { ...newGrid[r + 1][c], id: ++_idCtr };
              newGrid[r + 1][c] = makeTile(randLetter());
            }
          }
        }
        // Spawn new fire tile at bottom
        const col = Math.floor(Math.random() * GRID_W);
        if (newGrid[GRID_H - 1][col].type !== TFIRE) {
          newGrid[GRID_H - 1][col] = makeTile(newGrid[GRID_H - 1][col].letter, TFIRE);
        }
        // Re-check top row
        for (let c = 0; c < GRID_W; c++) {
          if (newGrid[0][c].type === TFIRE) { over = true; break; }
        }
      }
    }

    setGrid(newGrid);
    setScore(s => s + pts);
    setWordCount(newWc);
    setSelected([]);
    setLastWord(word.toUpperCase());

    if (over) {
      setGameOver(true);
    } else {
      const praise = word.length >= 8 ? `🔥 AMAZING! +${pts}`
                   : word.length >= 6 ? `⭐ Excellent! +${pts}`
                   : word.length >= 5 ? `✨ Great! +${pts}`
                   : `+${pts}`;
      showMsg(praise, word.length >= 6 ? "great" : "good");
    }
  }, [selected, grid, trie, wordCount, showMsg]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Enter") submitWord();
      if (e.key === "Escape") setSelected([]);
      if (e.key === "Backspace") setSelected(s => s.slice(0, -1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [submitWord]);

  // ── Tile visuals ──────────────────────────────────────────────────────────
  const getTileStyle = (r, c, tile) => {
    const isSel = selected.some(s => s.r === r && s.c === c);
    const isAdj = selected.length > 0 && !isSel && isAdjacent(selected[selected.length - 1], { r, c });

    let bg, border, shadow, color = "#fff", textShadow = "none";

    if (tile.type === TFIRE) {
      bg = isSel
        ? "linear-gradient(135deg,#ff9800,#f44336)"
        : "linear-gradient(135deg,#ff6b35,#c62828)";
      border = "2px solid #ffb300";
      shadow = "0 0 14px #ff6b3577";
      textShadow = "0 0 8px #fff6";
    } else if (tile.type === TDIA) {
      bg = isSel
        ? "linear-gradient(135deg,#80deea,#4dd0e1,#b2ebf2)"
        : "linear-gradient(135deg,#b2ebf2,#80deea,#26c6da)";
      border = "2px solid #00bcd4";
      shadow = isSel ? "0 0 18px #00bcd488, 0 0 0 3px #00e5ff66" : "0 0 12px #00bcd433";
      color = "#003d47";
    } else if (tile.type === TGOLD) {
      bg = isSel
        ? "linear-gradient(135deg,#ffe082,#ffca28,#ffd54f)"
        : "linear-gradient(135deg,#fff8e1,#ffe082,#ffc107)";
      border = "2px solid #ffb300";
      shadow = isSel ? "0 0 16px #ffca2877, 0 0 0 3px #ffe08266" : "0 0 10px #ffca2833";
      color = "#4a2e00";
    } else {
      const val = LETTER_VALUES[tile.letter] || 1;
      const hue = val <= 1 ? 215 : val <= 2 ? 155 : val <= 3 ? 35 : val <= 5 ? 15 : 345;
      const sat = val <= 1 ? 38 : 58;
      const lit = isSel ? 36 : 50;
      bg = `linear-gradient(135deg,hsl(${hue},${sat}%,${lit + 6}%),hsl(${hue},${sat}%,${lit}%))`;
      border = isSel ? `2px solid hsl(${hue},70%,65%)` : `2px solid hsl(${hue},25%,55%)`;
      shadow = isSel
        ? `0 0 0 3px hsl(${hue},70%,55%), 0 4px 14px #00000044`
        : `0 2px 6px #00000033,inset 0 1px 0 #ffffff22`;
    }

    if (isAdj && !isSel) shadow += ",0 0 0 2px #ffffff55";

    return {
      background: bg, border, boxShadow: shadow, color, textShadow,
      transform: isSel ? "scale(0.91)" : isAdj ? "scale(1.05)" : "scale(1)",
      opacity: popSet.has(tile.id) ? 0 : 1,
      transition: popSet.has(tile.id) ? "opacity 0.28s,transform 0.28s" : "all 0.14s ease",
    };
  };

  // ─── Start screen ──────────────────────────────────────────────────────────
  if (!started) {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Nunito',sans-serif}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}@keyframes shimmer{0%,100%{opacity:.7}50%{opacity:1}}`}</style>
        <div style={{
          minHeight:"100vh",
          background:"radial-gradient(ellipse at 30% 20%,#1a1a3e 0%,#0d0d1f 60%,#080814 100%)",
          display:"flex",alignItems:"center",justifyContent:"center",
          padding:"2rem",fontFamily:"'Nunito',sans-serif",
        }}>
          <div style={{textAlign:"center",maxWidth:440}}>
            <div style={{animation:"float 3s ease-in-out infinite",marginBottom:"0.5rem"}}>
              <h1 style={{
                fontFamily:"'Fredoka One',cursive",fontSize:"4.5rem",letterSpacing:"0.04em",
                background:"linear-gradient(135deg,#ffe082,#ff7043,#e91e63,#9c27b0)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                filter:"drop-shadow(0 0 24px #ff704355)",lineHeight:1.05,
              }}>WORD<br/>WEAVER</h1>
            </div>
            <p style={{color:"#6666aa",fontSize:"0.85rem",marginBottom:"2rem",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:700}}>
              Chain Letters · Score Big · Fight the Fire
            </p>

            {/* Tile type legend */}
            <div style={{display:"flex",gap:"0.6rem",justifyContent:"center",marginBottom:"2rem"}}>
              {[
                {bg:"linear-gradient(135deg,#5c6bc0,#3949ab)",border:"#7986cb",label:"TILE",sub:"normal",color:"#fff"},
                {bg:"linear-gradient(135deg,#fff8e1,#ffc107)",border:"#ffb300",label:"⭐",sub:"2× pts",color:"#4a2e00"},
                {bg:"linear-gradient(135deg,#b2ebf2,#26c6da)",border:"#00bcd4",label:"💎",sub:"3× pts",color:"#003d47"},
                {bg:"linear-gradient(135deg,#ff6b35,#c62828)",border:"#ffb300",label:"🔥",sub:"danger",color:"#fff"},
              ].map((t,i) => (
                <div key={i} style={{flex:1,textAlign:"center"}}>
                  <div style={{
                    background:t.bg,border:`2px solid ${t.border}`,
                    borderRadius:10,padding:"0.65rem 0.2rem",marginBottom:"0.3rem",
                    boxShadow:`0 4px 14px ${t.border}44`,
                    color:t.color,fontFamily:"'Fredoka One',cursive",fontSize:"1.1rem",
                  }}>{t.label}</div>
                  <div style={{color:"#6666aa",fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.06em"}}>{t.sub}</div>
                </div>
              ))}
            </div>

            {/* Rules */}
            <div style={{
              background:"#ffffff0a",borderRadius:16,padding:"1.1rem 1.4rem",
              border:"1px solid #ffffff14",marginBottom:"2rem",textAlign:"left",
            }}>
              {[
                "🔗  Click adjacent tiles (incl. diagonal) to chain",
                "✅  Submit 3+ letter words to score",
                "📏  5+ letter words earn gold & crystal tiles",
                "🔥  Fire spreads every 4 words — reach top = game over",
                "⌨️  Enter to submit  ·  Backspace to remove last  ·  Esc to clear",
              ].map(r => (
                <div key={r} style={{color:"#9999bb",fontSize:"0.82rem",marginBottom:"0.45rem",lineHeight:1.5}}>{r}</div>
              ))}
            </div>

            <button
              onClick={() => { setGrid(makeGrid()); setScore(0); setWordCount(0); setSelected([]); setLastWord(""); setGameOver(false); setStarted(true); }}
              style={{
                fontFamily:"'Fredoka One',cursive",fontSize:"1.4rem",letterSpacing:"0.06em",
                padding:"0.9rem 3.5rem",
                background:"linear-gradient(135deg,#ff7043,#e91e63)",
                color:"#fff",border:"none",borderRadius:50,cursor:"pointer",
                boxShadow:"0 6px 24px #e91e6344",
                transition:"transform 0.15s,box-shadow 0.15s",
              }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px) scale(1.04)";e.currentTarget.style.boxShadow="0 10px 30px #e91e6355";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 6px 24px #e91e6344";}}
            >PLAY</button>
          </div>
        </div>
      </>
    );
  }

  // ─── Game screen ──────────────────────────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Nunito',sans-serif;background:#080814}
        .dab-h:hover,.dab-v:hover{opacity:.65!important;background:#2b2d42!important}
        @keyframes fireFlicker{
          0%  {box-shadow:0 0 8px #ff6b35,0 0 20px #ff6b3555;}
          40% {box-shadow:0 0 16px #ff4500,0 0 32px #ff450044;}
          70% {box-shadow:0 0 12px #ffd600,0 0 24px #ffd60033;}
          100%{box-shadow:0 0 8px #ff6b35,0 0 20px #ff6b3555;}
        }
        .fire-tile{animation:fireFlicker .75s infinite}
        @keyframes msgIn{from{opacity:0;transform:translateY(-6px) scale(.9)}to{opacity:1;transform:none}}
        .msg-in{animation:msgIn .18s ease}
        @keyframes tileIn{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
        .tile-in{animation:tileIn .22s cubic-bezier(.175,.885,.32,1.275)}
      `}</style>

      <div style={{
        minHeight:"100vh",
        background:"radial-gradient(ellipse at 25% 10%,#1a1a3e 0%,#0d0d1f 60%,#080814 100%)",
        display:"flex",flexDirection:"column",alignItems:"center",
        padding:"1rem 0.75rem 2rem",fontFamily:"'Nunito',sans-serif",color:"#fff",
        userSelect:"none",
      }}>

        {/* Header */}
        <div style={{width:"100%",maxWidth:520,display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.6rem"}}>
          <h1 style={{
            fontFamily:"'Fredoka One',cursive",fontSize:"1.7rem",letterSpacing:"0.04em",
            background:"linear-gradient(135deg,#ffe082,#ff7043)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
          }}>WORD WEAVER</h1>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"0.6rem",color:"#555588",letterSpacing:"0.12em",textTransform:"uppercase"}}>Score</div>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:"1.7rem",color:"#ffe082",lineHeight:1}}>{score.toLocaleString()}</div>
          </div>
        </div>

        {/* Word bar */}
        <div style={{
          width:"100%",maxWidth:520,
          background:"#ffffff0c",border:"1px solid #ffffff18",
          borderRadius:14,padding:"0.55rem 0.8rem",
          marginBottom:"0.5rem",
          display:"flex",alignItems:"center",justifyContent:"space-between",
          minHeight:48,gap:"0.5rem",
        }}>
          <div style={{flex:1,minWidth:0}}>
            {currentWord ? (
              <span style={{
                fontFamily:"'Fredoka One',cursive",fontSize:"1.5rem",letterSpacing:"0.1em",
                color:wordIsValid?"#69f0ae":"#ccc",
                textShadow:wordIsValid?"0 0 14px #69f0ae77":"none",
                wordBreak:"break-all",
              }}>{currentWord}</span>
            ) : (
              <span style={{color:"#333366",fontSize:"0.85rem",fontWeight:600}}>Tap tiles to build a word…</span>
            )}
          </div>
          <div style={{display:"flex",gap:"0.4rem",alignItems:"center",flexShrink:0}}>
            {selected.length > 0 && (
              <button onClick={()=>setSelected([])} style={{
                background:"#cc3333",border:"none",borderRadius:8,color:"#fff",
                fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:"0.7rem",
                padding:"0.22rem 0.5rem",cursor:"pointer",
              }}>✕</button>
            )}
            <button
              onClick={submitWord}
              disabled={!wordIsValid}
              style={{
                background:wordIsValid?"linear-gradient(135deg,#00e676,#00bcd4)":"#22223a",
                border:"none",borderRadius:10,
                color:wordIsValid?"#fff":"#444466",
                fontFamily:"'Fredoka One',cursive",
                fontSize:"0.9rem",letterSpacing:"0.05em",
                padding:"0.3rem 0.9rem",
                cursor:wordIsValid?"pointer":"default",
                boxShadow:wordIsValid?"0 3px 12px #00e67644":"none",
                transition:"all 0.15s",
              }}
            >GO</button>
          </div>
        </div>

        {/* Message */}
        <div style={{height:26,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"0.4rem"}}>
          {message && (
            <span className="msg-in" style={{
              fontFamily:"'Fredoka One',cursive",fontSize:"1rem",letterSpacing:"0.05em",
              color:message.type==="great"?"#ffe082":message.type==="good"?"#69f0ae":"#ff5252",
              textShadow:message.type==="great"?"0 0 14px #ffe08266":message.type==="good"?"0 0 10px #69f0ae55":"none",
            }}>{message.text}</span>
          )}
        </div>

        {/* Grid — responsive sizing */}
        <div style={{
          width:"100%",maxWidth:520,
          display:"grid",
          gridTemplateColumns:`repeat(${GRID_W},1fr)`,
          gap:"clamp(3px,1vw,6px)",
          padding:"clamp(8px,2vw,14px)",
          background:"#ffffff07",
          borderRadius:20,
          border:"1px solid #ffffff10",
          boxShadow:"0 8px 40px #00000066",
          marginBottom:"0.75rem",
        }}>
          {grid.map((row,r) =>
            row.map((tile,c) => {
              const isSel = selected.some(s=>s.r===r&&s.c===c);
              const selIdx = selected.findIndex(s=>s.r===r&&s.c===c);
              const ts = getTileStyle(r,c,tile);
              const val = LETTER_VALUES[tile.letter]||1;
              return (
                <div
                  key={tile.id}
                  className={`tile-in${tile.type===TFIRE?" fire-tile":""}`}
                  onClick={()=>handleTileClick(r,c)}
                  style={{
                    aspectRatio:"1",borderRadius:"clamp(6px,1.5vw,10px)",
                    cursor:"pointer",
                    display:"flex",flexDirection:"column",
                    alignItems:"center",justifyContent:"center",
                    position:"relative",
                    ...ts,
                  }}
                >
                  <span style={{
                    fontFamily:"'Fredoka One',cursive",
                    fontSize:"clamp(0.9rem,3.8vw,1.45rem)",
                    lineHeight:1,
                  }}>{tile.letter}</span>
                  <span style={{fontSize:"clamp(0.38rem,1vw,0.55rem)",opacity:0.72,fontWeight:700,lineHeight:1,marginTop:1}}>{val}</span>

                  {tile.type===TDIA  && <span style={{position:"absolute",top:1,right:2,fontSize:"clamp(0.4rem,1vw,0.55rem)"}}>💎</span>}
                  {tile.type===TGOLD && <span style={{position:"absolute",top:1,right:2,fontSize:"clamp(0.4rem,1vw,0.55rem)"}}>⭐</span>}
                  {tile.type===TFIRE && <span style={{position:"absolute",top:0,right:1,fontSize:"clamp(0.45rem,1.1vw,0.6rem)"}}>🔥</span>}

                  {isSel && (
                    <span style={{
                      position:"absolute",top:1,left:2,
                      background:"#ffffffcc",color:"#222",
                      fontSize:"clamp(0.38rem,.9vw,.5rem)",fontWeight:800,
                      borderRadius:3,padding:"0 2px",lineHeight:"1.3",
                    }}>{selIdx+1}</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer stats */}
        <div style={{display:"flex",gap:"1.2rem",color:"#444466",fontSize:"0.73rem",fontWeight:700,letterSpacing:"0.07em",flexWrap:"wrap",justifyContent:"center"}}>
          <span>WORDS <span style={{color:"#8888aa"}}>{wordCount}</span></span>
          {lastWord && <span>LAST <span style={{color:"#ffcc80"}}>{lastWord}</span></span>}
          <span style={{color:"#cc4444"}}>🔥 FIRE EVERY 4 WORDS</span>
        </div>
      </div>

      {/* Game over modal */}
      {gameOver && (
        <div style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,.88)",
          display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,
        }}>
          <div style={{
            background:"linear-gradient(135deg,#1a1a3e,#0d0d2a)",
            border:"2px solid #ff704366",
            borderRadius:24,padding:"2.5rem 3rem",textAlign:"center",
            boxShadow:"0 20px 60px #00000088,0 0 40px #ff704322",
            maxWidth:360,width:"90%",
          }}>
            <div style={{fontSize:"3.5rem",marginBottom:"0.4rem"}}>🔥</div>
            <h2 style={{
              fontFamily:"'Fredoka One',cursive",fontSize:"2.4rem",
              background:"linear-gradient(135deg,#ff7043,#e91e63)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
              marginBottom:"0.4rem",
            }}>BURNED OUT!</h2>
            <p style={{color:"#7777aa",fontSize:"0.85rem",marginBottom:"1.4rem"}}>Fire reached the top of the board</p>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:"3rem",color:"#ffe082",lineHeight:1,marginBottom:"0.3rem"}}>{score.toLocaleString()}</div>
            <div style={{color:"#555588",fontSize:"0.72rem",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"2rem"}}>
              Final Score · {wordCount} words
            </div>
            <div style={{display:"flex",gap:"0.7rem",justifyContent:"center"}}>
              <button
                onClick={()=>{setGrid(makeGrid());setScore(0);setWordCount(0);setSelected([]);setLastWord("");setGameOver(false);setMessage(null);}}
                style={{
                  fontFamily:"'Fredoka One',cursive",fontSize:"1.1rem",
                  padding:"0.7rem 1.8rem",
                  background:"linear-gradient(135deg,#ff7043,#e91e63)",
                  color:"#fff",border:"none",borderRadius:50,cursor:"pointer",
                  boxShadow:"0 4px 16px #e91e6344",
                }}
              >PLAY AGAIN</button>
              <button
                onClick={()=>{setStarted(false);setGameOver(false);setMessage(null);}}
                style={{
                  fontFamily:"'Fredoka One',cursive",fontSize:"1.1rem",
                  padding:"0.7rem 1.4rem",
                  background:"transparent",color:"#7777aa",
                  border:"2px solid #333355",borderRadius:50,cursor:"pointer",
                }}
              >MENU</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
