/**
 * Target Line – Foundry VTT Module
 * Zeigt eine leuchtend blaue Linie vom kontrollierenden Token
 * zum anvisierten Token, solange ein Ziel markiert ist.
 */

const MODULE_ID = "target-line";

// ── Standard-Werte (Fallback, falls Settings noch nicht gespeichert) ──────────
const DEFAULTS = {
  lineColor:      "#00aaff",
  lineAlpha:      0.85,
  lineWidth:      2,
  glowColor:      "#55ccff",
  glowAlpha:      0.35,
  glowWidth:      8,
  pulseSpeed:     0.04,
  dashLength:     24,
  gapLength:      10,
  animateOffset:       true,
  offsetSpeed:         2,
  animationDirection:  "toTarget",   // "toTarget" | "fromTarget" | "both"
};

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

/** Liest alle Settings und gibt ein fertiges CONFIG-Objekt zurück. */
function getConfig() {
  const s = (key) => game.settings.get(MODULE_ID, key);
  return {
    lineColor:     hexStringToNumber(s("lineColor")),
    lineAlpha:     s("lineAlpha"),
    lineWidth:     s("lineWidth"),
    glowColor:     hexStringToNumber(s("glowColor")),
    glowAlpha:     s("glowAlpha"),
    glowWidth:     s("glowWidth"),
    pulseSpeed:    s("pulseSpeed"),
    dashLength:    s("dashLength"),
    gapLength:     s("gapLength"),
    animateOffset:       s("animateOffset"),
    offsetSpeed:         s("offsetSpeed"),
    animationDirection:  s("animationDirection"),
  };
}

/** Wandelt "#00aaff" → 0x00aaff (PIXI-Farbnummer). */
function hexStringToNumber(hex) {
  return parseInt(hex.replace("#", ""), 16);
}

/** Gibt das erste kontrollierte Token des aktuellen Spielers zurück. */
function getControlledToken() {
  return canvas.tokens.controlled[0] ?? null;
}

/** Gibt alle Ziel-Tokens zurück, die für den aktuellen User markiert sind. */
function getTargetedTokens() {
  return [...game.user.targets];
}

/** Mittelpunkt eines Tokens auf dem Canvas. */
function tokenCenter(token) {
  return {
    x: token.x + token.w / 2,
    y: token.y + token.h / 2,
  };
}

// ── Settings registrieren ────────────────────────────────────────────────────
function registerSettings() {
  const cfg = (key, type, def, extra = {}) =>
    game.settings.register(MODULE_ID, key, {
      name: `TARGETLINE.setting.${key}.name`,
      hint: `TARGETLINE.setting.${key}.hint`,
      scope:  "client",
      config: true,
      type,
      default: def,
      onChange: () => targetLineLayer.refresh(),
      ...extra,
    });

  // ── Kernlinie ──────────────────────────────────────────────────────────────
  cfg("lineColor",     String,  DEFAULTS.lineColor,    { type: String });
  cfg("lineAlpha",     Number,  DEFAULTS.lineAlpha,    { range: { min: 0, max: 1, step: 0.05 } });
  cfg("lineWidth",     Number,  DEFAULTS.lineWidth,    { range: { min: 1, max: 12, step: 0.5 } });

  // ── Glow ───────────────────────────────────────────────────────────────────
  cfg("glowColor",     String,  DEFAULTS.glowColor,    { type: String });
  cfg("glowAlpha",     Number,  DEFAULTS.glowAlpha,    { range: { min: 0, max: 1, step: 0.05 } });
  cfg("glowWidth",     Number,  DEFAULTS.glowWidth,    { range: { min: 1, max: 40, step: 1 } });

  // ── Dash / Animation ───────────────────────────────────────────────────────
  cfg("dashLength",    Number,  DEFAULTS.dashLength,   { range: { min: 4, max: 120, step: 2 } });
  cfg("gapLength",     Number,  DEFAULTS.gapLength,    { range: { min: 0, max: 60,  step: 1 } });
  cfg("animateOffset", Boolean, DEFAULTS.animateOffset);
  cfg("offsetSpeed",   Number,  DEFAULTS.offsetSpeed,  { range: { min: 0.5, max: 10, step: 0.5 } });
  cfg("pulseSpeed",    Number,  DEFAULTS.pulseSpeed,   { range: { min: 0,   max: 0.2, step: 0.005 } });

  // ── Animationsrichtung ─────────────────────────────────────────────────────
  game.settings.register(MODULE_ID, "animationDirection", {
    name: "TARGETLINE.setting.animationDirection.name",
    hint: "TARGETLINE.setting.animationDirection.hint",
    scope:   "client",
    config:  true,
    type:    String,
    default: DEFAULTS.animationDirection,
    choices: {
      "toTarget":   "TARGETLINE.setting.animationDirection.toTarget",
      "fromTarget": "TARGETLINE.setting.animationDirection.fromTarget",
      "both":       "TARGETLINE.setting.animationDirection.both",
    },
    onChange: () => targetLineLayer.refresh(),
  });
}

// ── Sprach-Strings registrieren (inline, kein externes JSON nötig) ────────────
function injectLocalization() {
  const strings = {
    "TARGETLINE.setting.lineColor.name":     "Linienfarbe",
    "TARGETLINE.setting.lineColor.hint":     "Farbe der schmalen Kernlinie (Hex-Farbcode, z.B. #00aaff).",
    "TARGETLINE.setting.lineAlpha.name":     "Linien-Deckkraft",
    "TARGETLINE.setting.lineAlpha.hint":     "Transparenz der Kernlinie (0 = unsichtbar, 1 = voll sichtbar).",
    "TARGETLINE.setting.lineWidth.name":     "Linienbreite",
    "TARGETLINE.setting.lineWidth.hint":     "Breite der Kernlinie in Pixeln.",
    "TARGETLINE.setting.glowColor.name":     "Glow-Farbe",
    "TARGETLINE.setting.glowColor.hint":     "Farbe des leuchtenden Halo-Effekts (Hex-Farbcode).",
    "TARGETLINE.setting.glowAlpha.name":     "Glow-Deckkraft",
    "TARGETLINE.setting.glowAlpha.hint":     "Transparenz des Glow-Kanals.",
    "TARGETLINE.setting.glowWidth.name":     "Glow-Breite",
    "TARGETLINE.setting.glowWidth.hint":     "Breite des Leuchteffekts in Pixeln.",
    "TARGETLINE.setting.dashLength.name":    "Strichlänge",
    "TARGETLINE.setting.dashLength.hint":    "Länge eines einzelnen Strich-Segments in Pixeln.",
    "TARGETLINE.setting.gapLength.name":     "Lückenlänge",
    "TARGETLINE.setting.gapLength.hint":     "Abstand zwischen zwei Strichen in Pixeln. 0 = durchgehende Linie.",
    "TARGETLINE.setting.animateOffset.name": "Lauflicht-Animation",
    "TARGETLINE.setting.animateOffset.hint": "Lässt die Strichlinie in Richtung Ziel laufen.",
    "TARGETLINE.setting.offsetSpeed.name":   "Animationsgeschwindigkeit",
    "TARGETLINE.setting.offsetSpeed.hint":   "Wie schnell das Lauflicht sich bewegt (Pixel pro Frame).",
    "TARGETLINE.setting.pulseSpeed.name":    "Puls-Geschwindigkeit",
    "TARGETLINE.setting.pulseSpeed.hint":    "Geschwindigkeit des Pulsierens der Endpunktkreise. 0 = kein Puls.",
    "TARGETLINE.setting.animationDirection.name":       "Animationsrichtung",
    "TARGETLINE.setting.animationDirection.hint":       "Richtung, in die sich die Strichlinie bewegt.",
    "TARGETLINE.setting.animationDirection.toTarget":   "→ Zum Ziel",
    "TARGETLINE.setting.animationDirection.fromTarget": "← Vom Ziel weg",
    "TARGETLINE.setting.animationDirection.both":       "↔ Beide Richtungen (gespiegelt)",
  };

  // Direkt in den globalen Foundry-Sprachspeicher einschreiben
  foundry.utils.mergeObject(game.i18n.translations, strings, { inplace: true });
}

// ── Haupt-Klasse ─────────────────────────────────────────────────────────────
class TargetLineLayer {
  constructor() {
    this.container   = null;
    this._ticker     = null;
    this._phase      = 0;
    this._dashOffset = 0;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  init() {
    Hooks.on("canvasReady",    () => this._onCanvasReady());
    Hooks.on("canvasTearDown", () => this._onCanvasTearDown());
    Hooks.on("targetToken",    () => this.refresh());
    Hooks.on("controlToken",   () => this.refresh());
    Hooks.on("updateToken",    () => this.refresh());
    Hooks.on("deleteToken",    () => this.refresh());

    console.log(`${MODULE_ID} | Modul initialisiert.`);
  }

  _onCanvasReady() {
    this.container = new PIXI.Container();
    this.container.sortableChildren = false;
    this.container.name = "targetLineContainer";
    canvas.tokens.addChild(this.container);

    this._ticker = (dt) => this._tick(dt);
    canvas.app.ticker.add(this._ticker);

    this.refresh();
  }

  _onCanvasTearDown() {
    if (this._ticker) {
      canvas.app.ticker.remove(this._ticker);
      this._ticker = null;
    }
    this.container = null;
  }

  // ── Zeichnen ───────────────────────────────────────────────────────────────

  refresh() {
    if (!this.container) return;
    this.container.removeChildren();

    const source  = getControlledToken();
    const targets = getTargetedTokens();
    if (!source || targets.length === 0) return;

    const cfg = getConfig();
    for (const target of targets) {
      if (target === source) continue;
      this._drawLine(source, target, cfg);
    }
  }

  _drawLine(source, target, cfg) {
    const from = tokenCenter(source);
    const to   = tokenCenter(target);
    const dx   = to.x - from.x;
    const dy   = to.y - from.y;
    const len  = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const dir = cfg.animationDirection;

    if (dir === "both") {
      // ── Beide Richtungen: je eine Schicht vorwärts + rückwärts ──────────────
      // Vorwärts-Glow (halbe Deckkraft, damit es sich nicht überstapelt)
      const glowFwd = new PIXI.Graphics();
      this._drawDashedLine(glowFwd, from, to, cfg,
        { color: cfg.glowColor, alpha: cfg.glowAlpha * 0.6, width: cfg.glowWidth },
        this._dashOffset);
      this.container.addChild(glowFwd);

      // Rückwärts-Glow
      const glowBwd = new PIXI.Graphics();
      this._drawDashedLine(glowBwd, to, from, cfg,
        { color: cfg.glowColor, alpha: cfg.glowAlpha * 0.6, width: cfg.glowWidth },
        this._dashOffset);
      this.container.addChild(glowBwd);

      // Vorwärts-Kern
      const coreFwd = new PIXI.Graphics();
      this._drawDashedLine(coreFwd, from, to, cfg,
        { color: cfg.lineColor, alpha: cfg.lineAlpha * 0.7, width: cfg.lineWidth },
        this._dashOffset);
      this.container.addChild(coreFwd);

      // Rückwärts-Kern
      const coreBwd = new PIXI.Graphics();
      this._drawDashedLine(coreBwd, to, from, cfg,
        { color: cfg.lineColor, alpha: cfg.lineAlpha * 0.7, width: cfg.lineWidth },
        this._dashOffset);
      this.container.addChild(coreBwd);

    } else {
      // ── Einzelne Richtung ────────────────────────────────────────────────────
      // Bei "fromTarget" einfach from/to tauschen
      const a = dir === "fromTarget" ? to   : from;
      const b = dir === "fromTarget" ? from : to;

      const glow = new PIXI.Graphics();
      this._drawDashedLine(glow, a, b, cfg,
        { color: cfg.glowColor, alpha: cfg.glowAlpha, width: cfg.glowWidth },
        this._dashOffset);
      this.container.addChild(glow);

      const core = new PIXI.Graphics();
      this._drawDashedLine(core, a, b, cfg,
        { color: cfg.lineColor, alpha: cfg.lineAlpha, width: cfg.lineWidth },
        this._dashOffset);
      this.container.addChild(core);
    }

    // ── Endpunkt-Kreise (immer gleich, unabhängig von Richtung) ─────────────
    const dots  = new PIXI.Graphics();
    const pulse = 0.6 + 0.4 * Math.sin(this._phase);

    dots.beginFill(cfg.glowColor, cfg.glowAlpha * pulse)
        .drawCircle(from.x, from.y, cfg.glowWidth * 0.8).endFill();
    dots.beginFill(cfg.lineColor, cfg.lineAlpha)
        .drawCircle(from.x, from.y, cfg.lineWidth * 1.5).endFill();

    dots.beginFill(cfg.glowColor, cfg.glowAlpha * pulse)
        .drawCircle(to.x, to.y, cfg.glowWidth * 1.2).endFill();
    dots.beginFill(cfg.lineColor, cfg.lineAlpha)
        .drawCircle(to.x, to.y, cfg.lineWidth * 2).endFill();

    this.container.addChild(dots);
  }

  /**
   * Zeichnet eine gestrichelte Linie von `from` nach `to`.
   * Der Offset bestimmt, wie weit die Dashes in Richtung `to` verschoben sind.
   */
  _drawDashedLine(gfx, from, to, cfg, { color, alpha, width }, offset = 0) {
    const dx  = to.x - from.x;
    const dy  = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux  = dx / len;
    const uy  = dy / len;

    const segment = cfg.dashLength + cfg.gapLength;
    const start   = segment > 0 ? -(((offset % segment) + segment) % segment) : 0;

    gfx.lineStyle({ width, color, alpha, cap: PIXI.LINE_CAP.ROUND });

    if (cfg.gapLength <= 0) {
      gfx.moveTo(from.x, from.y);
      gfx.lineTo(to.x, to.y);
      return;
    }

    for (let d = start; d < len; d += segment) {
      const dashStart = Math.max(d, 0);
      const dashEnd   = Math.min(d + cfg.dashLength, len);
      if (dashEnd <= dashStart) continue;
      gfx.moveTo(from.x + ux * dashStart, from.y + uy * dashStart);
      gfx.lineTo(from.x + ux * dashEnd,   from.y + uy * dashEnd);
    }
  }

  // ── Ticker ─────────────────────────────────────────────────────────────────

  _tick(_dt) {
    const cfg = getConfig();
    this._phase += cfg.pulseSpeed;
    if (cfg.animateOffset) this._dashOffset += cfg.offsetSpeed;

    const source  = getControlledToken();
    const targets = getTargetedTokens();
    if (!source || targets.length === 0) return;
    if (!this.container) return;

    this.container.removeChildren();
    for (const target of targets) {
      if (target === source) continue;
      this._drawLine(source, target, cfg);
    }
  }
}

// ── Einstiegspunkt ────────────────────────────────────────────────────────────
const targetLineLayer = new TargetLineLayer();

Hooks.once("init", () => {
  injectLocalization();
  registerSettings();
  targetLineLayer.init();
});
