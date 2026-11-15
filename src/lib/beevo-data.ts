export interface NavItem {
  label: string;
  href: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { label: "Features", href: "/features" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Examples", href: "/#examples" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
];

export const BENEFIT_STRIP_ITEMS = [
  {
    id: "storyboards",
    title: "AI storyboards",
    description: "Scenes planned around your narration",
    icon: "storyboard" as const,
  },
  {
    id: "illustrations",
    title: "Original illustrations",
    description: "Visuals generated for your story",
    icon: "illustrations" as const,
  },
  {
    id: "voiceover",
    title: "Natural voiceover",
    description: "Narration with real timing data",
    icon: "voiceover" as const,
  },
  {
    id: "credits",
    title: "One-time credits",
    description: "No recurring subscription",
    icon: "credits" as const,
  },
];

export const CORE_FEATURE_CARDS = [
  {
    id: "story-scenes",
    title: "AI Story & Scenes",
    description:
      "Beevo structures your narration script, identifies visual beats, and builds a dynamic storyboard.",
    icon: "sparkles" as const,
  },
  {
    id: "ai-animation",
    title: "AI Animation",
    description:
      "Original cartoon illustrations brought to life with smooth camera motion and clean transitions.",
    icon: "motion" as const,
  },
  {
    id: "ai-voiceover",
    title: "AI Voiceover",
    description:
      "Natural-sounding narration across supported catalog languages with real timestamp alignment.",
    icon: "voice" as const,
  },
  {
    id: "music-sfx",
    title: "Music & SFX",
    description:
      "Curated background tracks and subtle sound effects from Beevo's approved licensed audio library.",
    icon: "music" as const,
  },
];

export const THREE_STEPS = [
  {
    number: 1,
    title: "Describe It",
    description:
      "Paste your script or type your idea. It can be as simple as a single sentence.",
    image: "/images/beevo/step-describe.webp",
    imageAlt: "3D cream writing clipboard with a bright yellow pencil",
  },
  {
    number: 2,
    title: "Generate It",
    description:
      "Beevo plans the scenes, creates the illustrations and generates narration.",
    image: "/images/beevo/step-generate.webp",
    imageAlt: "3D black and white movie clapperboard with a blue play symbol",
  },
  {
    number: 3,
    title: "Download It",
    description:
      "Preview your completed video and download the MP4 when it is ready.",
    image: "/images/beevo/step-download.webp",
    imageAlt: "3D glossy violet-purple download button with white download arrow",
  },
];

export interface ExampleVideoDemo {
  id: string;
  title: string;
  duration: string;
  style: string;
  category: string;
  aspectRatio: string;
  image: string;
  imageAlt: string;
  summary: string;
  promptSample: string;
  sceneBeats: { timestamp: string; narration: string; motion: string }[];
}

export const EXAMPLE_DEMOS: ExampleVideoDemo[] = [
  {
    id: "life-cycle-of-a-bee",
    title: "The Life Cycle of a Bee",
    duration: "0:45",
    style: "3D Cartoon",
    category: "Science & Nature",
    aspectRatio: "16:9",
    image: "/images/beevo/example-bee-life.webp",
    imageAlt: "Friendly 3D Beevo bee hovering above a sunny spring meadow beside an oak tree beehive",
    summary:
      "An illustrative Beevo classroom demo showing how a simple science prompt transforms into narration-synced cartoon scenes with a consistent host character.",
    promptSample:
      "Explain the four stages of a honeybee's life cycle for elementary students using a friendly cartoon bee guide in a sunlit meadow.",
    sceneBeats: [
      {
        timestamp: "0:00 – 0:11",
        narration: "Deep inside a warm golden honeycomb, every busy honeybee begins life as a tiny pearl-white egg.",
        motion: "Gentle zoom-in across meadow hive",
      },
      {
        timestamp: "0:11 – 0:24",
        narration: "Three days later, a hungry little larva hatches and grows quickly while worker bees care for it.",
        motion: "Smooth horizontal pan with soft crossfade",
      },
      {
        timestamp: "0:24 – 0:35",
        narration: "Curled safely inside its wax cell, the pupa quietly transforms—growing delicate wings and bright stripes.",
        motion: "Slow focus reveal with synchronized captions",
      },
      {
        timestamp: "0:35 – 0:45",
        narration: "At last, an adult bee emerges into the morning sunshine, ready to pollinate blooming spring flowers.",
        motion: "Upward crane pan with cheerful meadow music",
      },
    ],
  },
  {
    id: "save-our-planet",
    title: "Save Our Planet",
    duration: "0:38",
    style: "3D Cartoon",
    category: "Children's Learning",
    aspectRatio: "16:9",
    image: "/images/beevo/example-save-planet.webp",
    imageAlt: "Two smiling children in a sunlit garden gently cradling a glowing miniature Earth globe",
    summary:
      "An illustrative Beevo educational demo highlighting everyday habits like saving water, planting trees, and recycling through warm character scenes.",
    promptSample:
      "Create a cheerful 38-second animated story for kids about three everyday habits that help protect Earth.",
    sceneBeats: [
      {
        timestamp: "0:00 – 0:12",
        narration: "Our Earth gives us clean air, bright oceans, and green parks—and even small hands can help protect it.",
        motion: "Gentle push-in on glowing Earth globe",
      },
      {
        timestamp: "0:12 – 0:25",
        narration: "Turning off extra lights, sorting recyclables, and planting seeds make neighborhoods greener every single week.",
        motion: "Crisp wipe transitions across illustrated actions",
      },
      {
        timestamp: "0:25 – 0:38",
        narration: "When everyone pitches in together, our shared planet stays healthy and bright for generations to come.",
        motion: "Slow pull-back across sunlit garden",
      },
    ],
  },
  {
    id: "the-solar-system",
    title: "The Solar System",
    duration: "0:50",
    style: "3D Cartoon",
    category: "Educational Explainer",
    aspectRatio: "16:9",
    image: "/images/beevo/example-solar-system.webp",
    imageAlt: "Friendly 3D Beevo mascot wearing a clear bubble space helmet floating past ringed Saturn, Earth, and Mars",
    summary:
      "An illustrative Beevo space demo pairing consistent astronaut-costume character framing with distinct planetary scenes and steady educational narration.",
    promptSample:
      "Take kids on a 50-second tour of the solar system with a cheerful bee astronaut visiting Earth, Mars, and ringed Saturn.",
    sceneBeats: [
      {
        timestamp: "0:00 – 0:15",
        narration: "Buckle your helmet! Eight unique planets orbit our bright Sun—each with its own colors, weather, and wonders.",
        motion: "Floating drift pan across starry space",
      },
      {
        timestamp: "0:15 – 0:33",
        narration: "Past rocky red Mars stretches giant golden Saturn, famous for thousands of sparkling icy rings.",
        motion: "Lateral glide toward ringed planet",
      },
      {
        timestamp: "0:33 – 0:50",
        narration: "And glowing blue and green in the distance is Earth—the only known planet teeming with life.",
        motion: "Gentle zoom settle with ambient synth bed",
      },
    ],
  },
  {
    id: "healthy-habits-for-kids",
    title: "Healthy Habits for Kids",
    duration: "0:42",
    style: "3D Cartoon",
    category: "Health & Wellness",
    aspectRatio: "16:9",
    image: "/images/beevo/example-healthy-habits.webp",
    imageAlt: "Two cheerful children running and playing together along a sunlit green park path",
    summary:
      "An illustrative Beevo storytelling demo designed for school lessons and family explainers about daily movement, water, and balanced rest.",
    promptSample:
      "Make a bright, upbeat 42-second cartoon story encouraging kids to play outdoors, drink water, and sleep well.",
    sceneBeats: [
      {
        timestamp: "0:00 – 0:14",
        narration: "Running, stretching, and playing outside in fresh air keeps growing muscles strong and minds curious.",
        motion: "Dynamic tracking pan along park path",
      },
      {
        timestamp: "0:14 – 0:28",
        narration: "Colorful fruits, clean drinking water, and washing hands keep energy steady throughout the whole school day.",
        motion: "Smooth slide transitions synced to narration",
      },
      {
        timestamp: "0:28 – 0:42",
        narration: "And a calm bedtime helps your body recharge so tomorrow feels just as bright.",
        motion: "Warm fade-out with uplifting acoustic track",
      },
    ],
  },
];

export interface PricingPack {
  id: "starter" | "creator" | "studio";
  name: string;
  priceInr: number;
  priceDisplay: string;
  credits: number;
  creditsLabel: string;
  capacityMinutes: number;
  capacityLabel: string;
  popular?: boolean;
  tagline: string;
  facts: string[];
  ratePerMinute: string;
}

export const PRICING_PACKS: PricingPack[] = [
  {
    id: "starter",
    name: "Starter",
    priceInr: 299,
    priceDisplay: "₹299",
    credits: 300,
    creditsLabel: "300 credits",
    capacityMinutes: 3,
    capacityLabel: "3 minutes total video capacity",
    tagline: "Ideal for trying Beevo on your first explainers or short stories.",
    ratePerMinute: "₹99.67 / minute",
    facts: [
      "300 one-time credits included",
      "3 minutes total video capacity",
      "All 8 cartoon styles & voice catalog",
      "Split across multiple short projects",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    priceInr: 599,
    priceDisplay: "₹599",
    credits: 800,
    creditsLabel: "800 credits",
    capacityMinutes: 8,
    capacityLabel: "8 minutes total video capacity",
    popular: true,
    tagline: "Built for educators, YouTube storytellers, and weekly explainers.",
    ratePerMinute: "₹74.88 / minute",
    facts: [
      "800 one-time credits included",
      "8 minutes total video capacity",
      "All 8 cartoon styles & voice catalog",
      "Split freely across shorts or full lessons",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    priceInr: 899,
    priceDisplay: "₹899",
    credits: 1500,
    creditsLabel: "1,500 credits",
    capacityMinutes: 15,
    capacityLabel: "15 minutes total video capacity",
    tagline: "Best per-minute value for series, courses, and training libraries.",
    ratePerMinute: "₹59.93 / minute",
    facts: [
      "1,500 one-time credits included",
      "15 minutes total video capacity",
      "All 8 cartoon styles & voice catalog",
      "Supports single projects up to 10 minutes",
    ],
  },
];

export const PRICING_CHECKLIST = [
  "One-time payment",
  "No subscriptions",
  "Credits do not expire under published policy",
  "All core creation features included",
];

export const PRODUCT_PIPELINE_STAGES = [
  {
    step: "01",
    title: "Prompt",
    engine: "Your Idea or Script",
    description: "Enter a one-line story concept or paste your complete narration script.",
  },
  {
    step: "02",
    title: "Script",
    engine: "OpenAI",
    description: "Refines narrative flow, natural spoken phrasing, and clear pacing beats.",
  },
  {
    step: "03",
    title: "Storyboard",
    engine: "OpenAI",
    description: "Breaks narration into meaningful visual moments and determines scene count dynamically.",
  },
  {
    step: "04",
    title: "Illustrations",
    engine: "fal.ai",
    description: "Creates consistent character references and original cartoon scene artwork.",
  },
  {
    step: "05",
    title: "Narration",
    engine: "ElevenLabs",
    description: "Generates natural AI voiceover with precise sentence and word timestamp alignment.",
  },
  {
    step: "06",
    title: "Dynamic Timeline",
    engine: "Beevo Engine",
    description: "Aligns every illustration, visual duration, and transition to real spoken timing.",
  },
  {
    step: "07",
    title: "Finished MP4",
    engine: "FFmpeg + R2",
    description: "Composes smooth camera motion, captions, and licensed audio into a downloadable MP4.",
  },
];

export const ARCHITECTURE_STACK = [
  {
    component: "OpenAI",
    role: "Storytelling, scriptwriting & dynamic storyboard planning",
    detail:
      "Interprets prompts or existing scripts, structures clear storytelling beats, and decides how many unique scenes best illustrate the narration.",
  },
  {
    component: "fal.ai",
    role: "Original illustration generation & character reference editing",
    detail:
      "Establishes consistent character references first, then generates cohesive cartoon artwork across scenes in your chosen visual style.",
  },
  {
    component: "ElevenLabs",
    role: "Natural voiceover & timestamp alignment",
    detail:
      "Synthesizes clear voice narration in supported catalog languages and returns real alignment timestamps so visuals stay locked to speech.",
  },
  {
    component: "Beevo Dynamic Timeline Engine",
    role: "Narration-to-scene synchronization",
    detail:
      "Calculates exact scene durations and transition points from real narration timestamps rather than fixed slideshow intervals.",
  },
  {
    component: "FFmpeg",
    role: "Camera motion, transitions, captions & final MP4 composition",
    detail:
      "Applies gentle pan/zoom camera movements, scene transitions, synchronized captions, and balanced background audio into a standard MP4.",
  },
  {
    component: "Cloudflare R2",
    role: "Private media asset & finished video storage",
    detail:
      "Stores project illustrations, narration audio, and rendered videos privately so you can preview and download your MP4 cleanly.",
  },
];

export interface VisualStyleItem {
  id: string;
  name: string;
  mood: string;
  bestFor: string;
  image: string;
}

export const VISUAL_STYLES: VisualStyleItem[] = [
  {
    id: "3d-cartoon",
    name: "3D Cartoon",
    mood: "Warm, dimensional family-film polish with soft depth of field.",
    bestFor: "Kids learning, mascots & friendly explainers",
    image: "/images/beevo/style-3d-cartoon.webp",
  },
  {
    id: "2d-cartoon",
    name: "2D Cartoon",
    mood: "Vibrant cel-shaded colors with crisp, expressive dark outlines.",
    bestFor: "YouTube storytime & upbeat educational lessons",
    image: "/images/beevo/style-2d-cartoon.webp",
  },
  {
    id: "anime-inspired",
    name: "Anime Inspired",
    mood: "Luminous sunlit skies, crisp linework, and expressive framing.",
    bestFor: "Adventure narratives & creator storytelling",
    image: "/images/beevo/style-anime-inspired.webp",
  },
  {
    id: "storybook",
    name: "Storybook",
    mood: "Nostalgic warm gouache tones with classic picture-book charm.",
    bestFor: "Bedtime tales, fables & primary education",
    image: "/images/beevo/style-storybook.webp",
  },
  {
    id: "clay-animation",
    name: "Clay Animation",
    mood: "Tactile handcrafted matte clay feel with miniature stop-motion warmth.",
    bestFor: "Playful explainers & standout social clips",
    image: "/images/beevo/style-clay-animation.webp",
  },
  {
    id: "comic-book",
    name: "Comic Book",
    mood: "Bold graphic ink work, punchy contrast, and classic halftone energy.",
    bestFor: "Fast-paced myth-busting & dramatic stories",
    image: "/images/beevo/style-comic-book.webp",
  },
  {
    id: "watercolor",
    name: "Watercolor",
    mood: "Airy translucent pigment washes resting gently on textured paper.",
    bestFor: "Nature stories, gentle lessons & reflective essays",
    image: "/images/beevo/style-watercolor.webp",
  },
  {
    id: "flat-vector",
    name: "Flat Vector",
    mood: "Clean editorial geometry with clear shapes and calm color balance.",
    bestFor: "Business presentations, onboarding & SaaS explainers",
    image: "/images/beevo/style-flat-vector.webp",
  },
];

export const USE_CASE_GROUPS = [
  {
    id: "education",
    title: "Education, Tutorials & Children's Learning",
    shortTitle: "Education & Kids Learning",
    href: "/use-cases/education",
    image: "/images/beevo/usecase-education.webp",
    imageAlt: "Educational storybook video layout featuring Beevo mascot in a sunny meadow",
    summary:
      "Turn lesson outlines, science concepts, moral tales, and language lessons into clear illustrated videos students can follow comfortably.",
    tags: ["Classroom lessons", "Children's stories", "Concept explainers"],
  },
  {
    id: "content-creators",
    title: "YouTube Storytelling & Social Explainers",
    shortTitle: "Content Creators",
    href: "/use-cases/content-creators",
    image: "/images/beevo/usecase-creators.webp",
    imageAlt: "Multi-frame animated storyboard timeline showing consistent character scenes",
    summary:
      "Produce narrative episodes in 16:9 for YouTube or punchy vertical explainers in 9:16 with consistent characters and synchronized narration.",
    tags: ["YouTube storytelling", "Vertical 9:16 clips", "Creative series"],
  },
  {
    id: "business-explainers",
    title: "Business Presentations & Team Training",
    shortTitle: "Business & Training",
    href: "/use-cases/business-explainers",
    image: "/images/beevo/usecase-business.webp",
    imageAlt: "Clean visual presentation board with Beevo mascot presenting charts and video",
    summary:
      "Explain product workflows, onboarding guidelines, and internal processes visually—without coordinating external animation studios.",
    tags: ["Product explainers", "Staff onboarding", "Training modules"],
  },
];

export const WORKFLOW_COMPARISON_ROWS = [
  {
    stage: "Script & Storyboarding",
    manual: "Draft script manually, then break down every visual cue and shot duration in spreadsheets or slides.",
    beevo: "Paste an idea or full script; OpenAI structures the narrative and plans visual storyboard moments dynamically.",
  },
  {
    stage: "Illustrations & Characters",
    manual: "Commission an illustrator or search mismatched clip-art libraries hoping characters resemble each other.",
    beevo: "fal.ai builds consistent character references and generates cohesive original illustrations in your selected style.",
  },
  {
    stage: "Voiceover & Audio Sync",
    manual: "Record or purchase voiceover separately, then scrub a timeline frame by frame to match visuals to speech.",
    beevo: "ElevenLabs generates natural narration with real timestamp data; Beevo's Dynamic Timeline syncs scenes automatically.",
  },
  {
    stage: "Motion, Captions & Export",
    manual: "Keyframe zoom/pan motion, format subtitles manually, balance background audio, and render in desktop editors.",
    beevo: "FFmpeg composes smooth camera movement, transitions, synchronized captions, and licensed audio into a finished MP4.",
  },
];

export interface FaqItem {
  id: string;
  category: "Product & Method" | "Visuals & Voice" | "Credits & Billing" | "Reliability";
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-beevo",
    category: "Product & Method",
    question: "What is Beevo?",
    answer:
      "Beevo is an AI-powered illustrated cartoon storytelling and explainer video platform. You describe an idea or paste a finished script, and Beevo plans the storyboard, generates consistent cartoon illustrations, creates natural AI voiceover with real timestamp alignment, adds camera motion, transitions, captions, and licensed background audio, and exports a downloadable MP4.",
  },
  {
    id: "how-videos-created",
    category: "Product & Method",
    question: "How are videos created in Beevo?",
    answer:
      "Beevo runs a structured multi-stage production pipeline: OpenAI drafts or refines your script and plans a dynamic storyboard; fal.ai establishes character references and renders original cartoon illustrations; ElevenLabs generates natural narration with alignment timestamps; Beevo's Dynamic Timeline Engine matches each visual scene to spoken timing; and FFmpeg composes smooth motion, transitions, captions, and licensed audio into your final MP4 stored privately on Cloudflare R2.",
  },
  {
    id: "continuous-ai-video",
    category: "Product & Method",
    question: "Are these continuous AI-generated videos?",
    answer:
      "No—and we believe in stating that clearly. Beevo creates composed animated storytelling videos built from consistent AI-generated cartoon illustrations, real voiceover alignment, smooth camera pan/zoom motion graphics, scene transitions, captions, and audio mixing. That approach preserves character clarity, narrative legibility, and predictable pacing over multi-minute videos up to 10 minutes long.",
  },
  {
    id: "how-illustrations-chosen",
    category: "Visuals & Voice",
    question: "How are illustrations chosen for each scene?",
    answer:
      "Beevo analyzes your narration script sentence by sentence to identify meaningful visual shifts—such as a new location, action, character expression, or concept explanation. Each storyboard moment receives an art-directed illustration prompt guided by your selected visual style and character reference so scenes flow smoothly together.",
  },
  {
    id: "dynamic-image-count",
    category: "Visuals & Voice",
    question: "Is the image count fixed per video?",
    answer:
      "No. Beevo decides how many illustrations your story genuinely needs based on narration complexity, visual moments, and your chosen visual pacing. Dense concept explainers naturally receive tighter visual changes, while calm storybooks hold illustrations slightly longer when narration lingers on one moment.",
  },
  {
    id: "voice-sync",
    category: "Visuals & Voice",
    question: "How does voice synchronization work?",
    answer:
      "Beevo generates voiceover through ElevenLabs alongside real narration alignment timestamps. Beevo's Dynamic Timeline Engine reads those timestamps to trigger each scene transition and caption cue precisely when the matching sentence is spoken—eliminating awkward fixed-interval slideshows.",
  },
  {
    id: "languages-supported",
    category: "Visuals & Voice",
    question: "Which languages are supported, including Hindi?",
    answer:
      "Beevo supports natural voiceover across our active ElevenLabs voice catalog, including English, Hindi, and additional supported multilingual voices. You can write your prompt or paste a full narration script in your preferred supported language and adjust speech pacing before rendering.",
  },
  {
    id: "choose-styles",
    category: "Visuals & Voice",
    question: "Can I choose the cartoon visual style?",
    answer:
      "Yes. Every credit pack unlocks all eight Beevo visual styles: 3D Cartoon, 2D Cartoon, Anime Inspired, Storybook, Clay Animation, Comic Book, Watercolor, and Flat Vector. You can pick the style that best fits your audience before generating.",
  },
  {
    id: "ten-minute-limit",
    category: "Product & Method",
    question: "Can a single project be up to 10 minutes long?",
    answer:
      "Yes. An individual Beevo video project can run up to 10 minutes in length, provided your account holds enough credits for the selected duration (100 credits per minute, billed in 15-second increments of 25 credits).",
  },
  {
    id: "how-credits-work",
    category: "Credits & Billing",
    question: "How do Beevo credits work?",
    answer:
      "Credit metering is simple and transparent: 100 credits equal 1 minute of finished video, and 25 credits equal 15 seconds. Starter (₹299) provides 300 credits (3 minutes), Creator (₹599) provides 800 credits (8 minutes), and Studio (₹899) provides 1,500 credits (15 minutes). You can split your credits freely across multiple shorter or longer projects.",
  },
  {
    id: "credits-expire",
    category: "Credits & Billing",
    question: "Do purchased credits expire?",
    answer:
      "Under Beevo's published credit policy, purchased one-time credits do not expire. You can buy a pack once and create videos whenever your next script or lesson is ready, without watching unused monthly quota disappear.",
  },
  {
    id: "is-there-subscription",
    category: "Credits & Billing",
    question: "Is there a monthly subscription?",
    answer:
      "No. Beevo uses straightforward one-time credit pack purchases only. There are no recurring monthly renewals, no hidden auto-charges, and no cancellation hoops.",
  },
  {
    id: "generation-fails",
    category: "Reliability",
    question: "What happens if video generation fails?",
    answer:
      "If a video generation fails due to a technical or pipeline error before producing a completed output, the credits reserved for that failed generation are not permanently deducted—they are automatically returned to your Beevo credit balance so you can retry safely. See our Refund Policy for full details.",
  },
];
