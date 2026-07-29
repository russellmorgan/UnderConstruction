// Barker dialogue data — three pools of lines (below-threshold, above-threshold, and fail/hazard)
// voiced as a dry, fourth-wall-aware midway barker. NarratorSystem selects from these at runtime.
// peace with it. Dry, sarcastic, needles the player without ever being cruel. The
// fourth-wall break is the house style, not the rare exception.

export const BELOW_THRESHOLD_LINES = [
  'Folks, we have a generous player tonight! Generous to the pegs!',
  "Don't you fret — the board's only just warming up to you.",
  'I have seen worse. Not lately. But I have seen worse.',
  'Every great run starts with a couple of donations.',
  "The prize shelf isn't going anywhere. Sadly.",
  "That was physics, friend. I'd blame someone, but nobody's here.",
  'The game is not rigged. It simply has opinions.',
  "Somewhere a developer wrote a number, and that number wasn't kind to you.",
  "I'm contractually obliged to sound excited. Give me something to work with.",
  'Aim is optional. Results, as you can see, are also optional.',
  'The ball goes where gravity says. Gravity has not read your strategy.',
  "You can absolutely restart. I'll be here. I'm always here.",
  "Bold choice. Not a good one, but I admire the commitment.",
];

export const ABOVE_THRESHOLD_LINES = [
  'Step back, step BACK — this one knows the board!',
  'Ladies and gentlemen, that is a paying customer no more!',
  'The pegs are getting nervous. I can hear it from here.',
  'Somebody get the big prize down off the top shelf!',
  'Now THAT is how the midway is supposed to sound!',
  "Fantastic. Now I have to act surprised for the rest of the night.",
  'You may tell people that was skill. I will not contradict you.',
  "That's the sound of a number going up. Enjoy it. Numbers are fickle.",
  'Do that again and I start suspecting you read the source code.',
  "Wonderful. Truly. And no, it doesn't unlock anything.",
  "The prize shelf just made brief, uncomfortable eye contact with you.",
  'Somewhere, a difficulty curve is filing a complaint.',
];

// Fired the instant the hazard peg pops a ball — a reaction, not a threshold check.
export const FAIL_LINES = [
  'Oh, that one is GONE. Gone forever.',
  "That ball won't be needing a return ticket.",
  'The mine takes its cut. It always does.',
  'Rule one of the midway: mind the spikes.',
  'The spiky one. The red one. With the exclamation point on it.',
  'We put a warning label on it. We really did all we could.',
  "That ball has been deleted. Not destroyed — deleted. There's a difference.",
  'And the midway claims another. I keep a tally. It is long.',
  'To be fair, it was clearly labelled. To be fairer, you hit it anyway.',
];
