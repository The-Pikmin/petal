<script lang="ts">
	import { onMount } from "svelte";

	let mounted = $state(false);

	const stages = [
		"Uploading image",
		"Preprocessing image",
		"Running plant ID model",
		"Matching species",
		"Extracting genus",
		"Running disease model",
		"Analyzing results",
	];

	let stageIndex = $state(0);

	const currentStage = $derived(stages[stageIndex]);

	onMount(() => {
		mounted = true;

		const interval = setInterval(() => {
			stageIndex = (stageIndex + 1) % stages.length;
		}, 2400);

		return () => clearInterval(interval);
	});
</script>

<div class="loader-root" class:mounted>
	<svg viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg" class="plant-svg">
		<!-- Pot -->
		<path d="M72,270 L68,300 L132,300 L128,270 Z" class="pot-body" />
		<rect x="64" y="264" width="72" height="10" rx="3" class="pot-rim" />
		<ellipse cx="100" cy="300" rx="32" ry="4" class="pot-base" />
		<!-- Soil -->
		<ellipse cx="100" cy="268" rx="30" ry="5" class="soil" />

		<!-- Main stem -->
		<g class="stem-group">
			<path
				d="M100,265 C98,240 102,220 99,195 C96,170 103,145 100,120 C97,95 101,75 100,55"
				class="stem"
			/>
		</g>

		<!-- Leaf pair 1 (lowest) -->
		<g class="leaf leaf-1-left" style="transform-origin: 100px 215px">
			<path d="M100,215 C85,205 65,210 55,200 C62,195 80,190 100,208" class="leaf-shape" />
			<path d="M100,213 C88,207 72,208 60,202" class="leaf-vein" />
		</g>
		<g class="leaf leaf-1-right" style="transform-origin: 100px 215px">
			<path
				d="M100,215 C115,205 135,210 145,200 C138,195 120,190 100,208"
				class="leaf-shape"
			/>
			<path d="M100,213 C112,207 128,208 140,202" class="leaf-vein" />
		</g>

		<!-- Leaf pair 2 -->
		<g class="leaf leaf-2-left" style="transform-origin: 100px 170px">
			<path
				d="M100,170 C82,158 58,165 45,152 C54,146 78,142 100,162"
				class="leaf-shape leaf-shape-mid"
			/>
			<path d="M100,168 C84,159 64,162 50,154" class="leaf-vein" />
		</g>
		<g class="leaf leaf-2-right" style="transform-origin: 100px 170px">
			<path
				d="M100,170 C118,158 142,165 155,152 C146,146 122,142 100,162"
				class="leaf-shape leaf-shape-mid"
			/>
			<path d="M100,168 C116,159 136,162 150,154" class="leaf-vein" />
		</g>

		<!-- Leaf pair 3 (highest) -->
		<g class="leaf leaf-3-left" style="transform-origin: 100px 120px">
			<path
				d="M100,120 C80,106 54,115 40,100 C50,93 79,90 100,112"
				class="leaf-shape leaf-shape-top"
			/>
			<path d="M100,118 C82,108 60,113 46,103" class="leaf-vein" />
		</g>
		<g class="leaf leaf-3-right" style="transform-origin: 100px 120px">
			<path
				d="M100,120 C120,106 146,115 160,100 C150,93 121,90 100,112"
				class="leaf-shape leaf-shape-top"
			/>
			<path d="M100,118 C118,108 140,113 154,103" class="leaf-vein" />
		</g>

		<!-- Top sprout / new leaf unfurling -->
		<g class="sprout" style="transform-origin: 100px 58px">
			<path
				d="M100,58 C96,42 88,30 82,18 C90,22 97,35 100,50"
				class="sprout-leaf sprout-left"
			/>
			<path
				d="M100,58 C104,42 112,30 118,18 C110,22 103,35 100,50"
				class="sprout-leaf sprout-right"
			/>
		</g>
	</svg>

	<div class="status-text">
		<p class="status-label">Analyzing your plant</p>
		<div class="dot-pulse">
			<span class="dot"></span>
			<span class="dot"></span>
			<span class="dot"></span>
		</div>
	</div>
	{#key stageIndex}
		<p class="stage-label">{currentStage}</p>
	{/key}
</div>

<style>
	/*
	 * Animation cycle (7s loop):
	 *   0-30%   grow out   (stem draws, leaves unfurl with overshoot)
	 *  30-55%   hold open  (gentle wind sway)
	 *  55-85%   furl back  (leaves curl in, stem retracts)
	 *  85-100%  hold closed (brief rest before next cycle)
	 */

	.loader-root {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		min-height: 70vh;
	}

	.plant-svg {
		width: 220px;
		height: 280px;
		filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08));
	}

	/* --- Pot --- */
	.pot-body {
		fill: hsl(20, 55%, 48%);
	}
	.pot-rim {
		fill: hsl(20, 55%, 42%);
	}
	.pot-base {
		fill: hsl(20, 55%, 38%);
	}
	.soil {
		fill: hsl(30, 40%, 28%);
	}

	/* ================================================================
	   STEM  – draws up then retracts
	   ================================================================ */
	.stem {
		fill: none;
		stroke: hsl(130, 45%, 40%);
		stroke-width: 3.5;
		stroke-linecap: round;
		stroke-dasharray: 220;
		stroke-dashoffset: 220;
	}
	.mounted .stem {
		animation: stem-cycle 7s ease-in-out infinite;
	}

	@keyframes stem-cycle {
		0% {
			stroke-dashoffset: 220;
		}
		28% {
			stroke-dashoffset: 0;
		}
		55% {
			stroke-dashoffset: 0;
		}
		83% {
			stroke-dashoffset: 220;
		}
		100% {
			stroke-dashoffset: 220;
		}
	}

	.stem-group {
		transform-origin: 100px 265px;
	}
	.mounted .stem-group {
		animation: stem-sway 7s ease-in-out infinite;
	}
	@keyframes stem-sway {
		0%,
		28% {
			transform: rotate(0deg);
		}
		36% {
			transform: rotate(0.8deg);
		}
		44% {
			transform: rotate(-0.5deg);
		}
		52% {
			transform: rotate(0.3deg);
		}
		55% {
			transform: rotate(0deg);
		}
		83%,
		100% {
			transform: rotate(0deg);
		}
	}

	/* ================================================================
	   LEAVES – shared base styles
	   ================================================================ */
	.leaf-shape {
		fill: hsl(130, 52%, 50%);
		opacity: 0.92;
	}
	.leaf-shape-mid {
		fill: hsl(135, 52%, 48%);
	}
	.leaf-shape-top {
		fill: hsl(140, 55%, 52%);
	}
	.leaf-vein {
		fill: none;
		stroke: hsl(130, 40%, 38%);
		stroke-width: 0.8;
		stroke-linecap: round;
		opacity: 0.5;
	}

	.leaf {
		transform: scale(0) rotate(0deg);
		opacity: 0;
	}

	/*
	 * Each leaf pair has its own keyframes so the stagger and wind sway
	 * directions feel organic.  The cycle timing mirrors the stem:
	 *   sprout  ~13-30%  (staggered per pair)
	 *   sway    30-55%
	 *   furl    55-78%   (staggered per pair)
	 *   hidden  78-100%
	 */

	/* --- Pair 1 (lowest, earliest) --- */
	.mounted .leaf-1-left {
		animation: l1l 7s ease-in-out infinite;
	}
	.mounted .leaf-1-right {
		animation: l1r 7s ease-in-out infinite;
	}

	@keyframes l1l {
		0%,
		13% {
			transform: scale(0) rotate(30deg);
			opacity: 0;
		}
		22% {
			transform: scale(1.12) rotate(-5deg);
			opacity: 1;
		}
		26% {
			transform: scale(0.96) rotate(2deg);
			opacity: 1;
		}
		28% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		/* sway */
		36% {
			transform: scale(1) rotate(3deg) translateX(2px);
			opacity: 1;
		}
		44% {
			transform: scale(1) rotate(-2deg) translateX(-1px);
			opacity: 1;
		}
		52% {
			transform: scale(1) rotate(1deg) translateX(1px);
			opacity: 1;
		}
		55% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		/* furl */
		63% {
			transform: scale(0.96) rotate(2deg);
			opacity: 1;
		}
		72% {
			transform: scale(0) rotate(30deg);
			opacity: 0;
		}
		100% {
			transform: scale(0) rotate(30deg);
			opacity: 0;
		}
	}
	@keyframes l1r {
		0%,
		14% {
			transform: scale(0) rotate(-30deg);
			opacity: 0;
		}
		23% {
			transform: scale(1.12) rotate(5deg);
			opacity: 1;
		}
		27% {
			transform: scale(0.96) rotate(-2deg);
			opacity: 1;
		}
		29% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		36% {
			transform: scale(1) rotate(2.5deg) translateX(2px);
			opacity: 1;
		}
		44% {
			transform: scale(1) rotate(-2deg) translateX(-1px);
			opacity: 1;
		}
		52% {
			transform: scale(1) rotate(1.5deg) translateX(1px);
			opacity: 1;
		}
		55% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		64% {
			transform: scale(0.96) rotate(-2deg);
			opacity: 1;
		}
		73% {
			transform: scale(0) rotate(-30deg);
			opacity: 0;
		}
		100% {
			transform: scale(0) rotate(-30deg);
			opacity: 0;
		}
	}

	/* --- Pair 2 (mid) --- */
	.mounted .leaf-2-left {
		animation: l2l 7s ease-in-out infinite;
	}
	.mounted .leaf-2-right {
		animation: l2r 7s ease-in-out infinite;
	}

	@keyframes l2l {
		0%,
		17% {
			transform: scale(0) rotate(30deg);
			opacity: 0;
		}
		25% {
			transform: scale(1.12) rotate(-5deg);
			opacity: 1;
		}
		28% {
			transform: scale(0.96) rotate(2deg);
			opacity: 1;
		}
		30% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		38% {
			transform: scale(1) rotate(3.5deg) translateX(2px);
			opacity: 1;
		}
		46% {
			transform: scale(1) rotate(-1.5deg) translateX(-1px);
			opacity: 1;
		}
		53% {
			transform: scale(1) rotate(1deg);
			opacity: 1;
		}
		55% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		60% {
			transform: scale(0.96) rotate(2deg);
			opacity: 1;
		}
		68% {
			transform: scale(0) rotate(30deg);
			opacity: 0;
		}
		100% {
			transform: scale(0) rotate(30deg);
			opacity: 0;
		}
	}
	@keyframes l2r {
		0%,
		18% {
			transform: scale(0) rotate(-30deg);
			opacity: 0;
		}
		26% {
			transform: scale(1.12) rotate(5deg);
			opacity: 1;
		}
		29% {
			transform: scale(0.96) rotate(-2deg);
			opacity: 1;
		}
		31% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		38% {
			transform: scale(1) rotate(3deg) translateX(2px);
			opacity: 1;
		}
		46% {
			transform: scale(1) rotate(-2deg) translateX(-1px);
			opacity: 1;
		}
		53% {
			transform: scale(1) rotate(1.5deg);
			opacity: 1;
		}
		55% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		61% {
			transform: scale(0.96) rotate(-2deg);
			opacity: 1;
		}
		69% {
			transform: scale(0) rotate(-30deg);
			opacity: 0;
		}
		100% {
			transform: scale(0) rotate(-30deg);
			opacity: 0;
		}
	}

	/* --- Pair 3 (top, latest) --- */
	.mounted .leaf-3-left {
		animation: l3l 7s ease-in-out infinite;
	}
	.mounted .leaf-3-right {
		animation: l3r 7s ease-in-out infinite;
	}

	@keyframes l3l {
		0%,
		21% {
			transform: scale(0) rotate(30deg);
			opacity: 0;
		}
		28% {
			transform: scale(1.12) rotate(-5deg);
			opacity: 1;
		}
		31% {
			transform: scale(0.96) rotate(2deg);
			opacity: 1;
		}
		33% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		40% {
			transform: scale(1) rotate(4deg) translateX(2px);
			opacity: 1;
		}
		48% {
			transform: scale(1) rotate(-1.5deg) translateX(-1px);
			opacity: 1;
		}
		53% {
			transform: scale(1) rotate(1deg);
			opacity: 1;
		}
		55% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		58% {
			transform: scale(0.96) rotate(2deg);
			opacity: 1;
		}
		65% {
			transform: scale(0) rotate(30deg);
			opacity: 0;
		}
		100% {
			transform: scale(0) rotate(30deg);
			opacity: 0;
		}
	}
	@keyframes l3r {
		0%,
		22% {
			transform: scale(0) rotate(-30deg);
			opacity: 0;
		}
		29% {
			transform: scale(1.12) rotate(5deg);
			opacity: 1;
		}
		32% {
			transform: scale(0.96) rotate(-2deg);
			opacity: 1;
		}
		34% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		40% {
			transform: scale(1) rotate(3.5deg) translateX(2px);
			opacity: 1;
		}
		48% {
			transform: scale(1) rotate(-2deg) translateX(-1px);
			opacity: 1;
		}
		53% {
			transform: scale(1) rotate(1.5deg);
			opacity: 1;
		}
		55% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		59% {
			transform: scale(0.96) rotate(-2deg);
			opacity: 1;
		}
		66% {
			transform: scale(0) rotate(-30deg);
			opacity: 0;
		}
		100% {
			transform: scale(0) rotate(-30deg);
			opacity: 0;
		}
	}

	/* ================================================================
	   SPROUT – top bud, last to open, first to close
	   ================================================================ */
	.sprout-leaf {
		fill: hsl(145, 58%, 55%);
		opacity: 0;
	}

	.mounted .sprout-left {
		animation: sp-l 7s ease-in-out infinite;
	}
	.mounted .sprout-right {
		animation: sp-r 7s ease-in-out infinite;
	}

	@keyframes sp-l {
		0%,
		25% {
			opacity: 0;
			transform: scaleY(0) rotate(15deg);
		}
		33% {
			opacity: 1;
			transform: scaleY(1.15) rotate(-3deg);
		}
		36% {
			opacity: 1;
			transform: scaleY(1) rotate(0deg);
		}
		/* sway */
		42% {
			opacity: 1;
			transform: scaleY(1.02) rotate(2deg) translateY(-1px);
		}
		50% {
			opacity: 1;
			transform: scaleY(0.98) rotate(-1.5deg) translateY(0.5px);
		}
		55% {
			opacity: 1;
			transform: scaleY(1) rotate(0deg);
		}
		/* furl */
		58% {
			opacity: 1;
			transform: scaleY(1) rotate(0deg);
		}
		63% {
			opacity: 0;
			transform: scaleY(0) rotate(15deg);
		}
		100% {
			opacity: 0;
			transform: scaleY(0) rotate(15deg);
		}
	}
	@keyframes sp-r {
		0%,
		26% {
			opacity: 0;
			transform: scaleY(0) rotate(-15deg);
		}
		34% {
			opacity: 1;
			transform: scaleY(1.15) rotate(3deg);
		}
		37% {
			opacity: 1;
			transform: scaleY(1) rotate(0deg);
		}
		42% {
			opacity: 1;
			transform: scaleY(1.02) rotate(-2deg) translateY(-1px);
		}
		50% {
			opacity: 1;
			transform: scaleY(0.98) rotate(1.5deg) translateY(0.5px);
		}
		55% {
			opacity: 1;
			transform: scaleY(1) rotate(0deg);
		}
		59% {
			opacity: 1;
			transform: scaleY(1) rotate(0deg);
		}
		64% {
			opacity: 0;
			transform: scaleY(0) rotate(-15deg);
		}
		100% {
			opacity: 0;
			transform: scaleY(0) rotate(-15deg);
		}
	}

	/* ================================================================
	   TEXT & DOTS
	   ================================================================ */
	.status-text {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 1.5rem;
	}

	.status-label {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--foreground, hsl(0, 0%, 15%));
	}

	.stage-label {
		font-size: 0.8rem;
		color: var(--muted-foreground, hsl(0, 0%, 45%));
		margin-top: 0.35rem;
		animation: stage-fade 2.4s ease-in-out;
	}

	@keyframes stage-fade {
		0% {
			opacity: 0;
			transform: translateY(4px);
		}
		12% {
			opacity: 1;
			transform: translateY(0);
		}
		85% {
			opacity: 1;
			transform: translateY(0);
		}
		100% {
			opacity: 0;
			transform: translateY(-4px);
		}
	}

	.dot-pulse {
		display: flex;
		gap: 3px;
		align-items: center;
		padding-top: 2px;
	}
	.dot {
		display: block;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--foreground, hsl(0, 0%, 15%));
		animation: dot-bounce 1.4s ease-in-out infinite;
	}
	.dot:nth-child(2) {
		animation-delay: 0.2s;
	}
	.dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes dot-bounce {
		0%,
		60%,
		100% {
			opacity: 0.25;
			transform: translateY(0);
		}
		30% {
			opacity: 1;
			transform: translateY(-3px);
		}
	}
</style>
