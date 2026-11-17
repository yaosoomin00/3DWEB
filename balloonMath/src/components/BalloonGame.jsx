
import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const BalloonGame = () => {
  const gameRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!gameRef.current || instanceRef.current) return;

    class BalloonScene extends Phaser.Scene {
      constructor() {
        super("BalloonScene");

        this.score = 0;
        this.lives = 3;
        this.round = 0;
        this.maxRounds = 10;
        this.timeLeft = 90;
        this.combo = 0;
        this.bestCombo = 0;
        this.level = "Easy";

        this.active = false;
        this.locked = false;

        this.balloons = [];
        this.timerEvent = null;
        this.musicEvent = null;

        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.audioContext = null;
        this.masterGain = null;
        this.musicIndex = 0;
      }

      create() {
        this.drawBackground();
        this.showMenu();
      }

      // ==================================
      // AUDIO SYSTEM
      // ==================================

      initAudio() {
        if (this.audioContext) {
          if (this.audioContext.state === "suspended") {
            this.audioContext.resume();
          }
          return;
        }

        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        this.audioContext = new AudioContextClass();

        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.7;
        this.masterGain.connect(this.audioContext.destination);
      }

      playTone(
        frequency,
        duration = 0.2,
        type = "sine",
        volume = 1,
        delay = 0
      ) {
        if (!this.audioContext || !this.masterGain) return;

        const ctx = this.audioContext;

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        const start = ctx.currentTime + delay;

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(
          Math.max(0.001, volume),
          start + 0.02
        );

        gain.gain.exponentialRampToValueAtTime(
          0.001,
          start + duration
        );

        oscillator.connect(gain);
        gain.connect(this.masterGain);

        oscillator.start(start);
        oscillator.stop(start + duration + 0.03);
      }

      playSound(name) {
        if (!this.sfxEnabled) return;

        this.initAudio();

        if (!this.audioContext) return;

        switch (name) {
          case "click":
            this.playTone(550, 0.08, "sine", 0.1);
            break;

          case "pop":
            this.playTone(700, 0.08, "sine", 0.18);
            this.playTone(1100, 0.12, "sine", 0.12, 0.04);
            break;

          case "correct":
            this.playTone(523, 0.16, "sine", 0.18);
            this.playTone(659, 0.16, "sine", 0.18, 0.13);
            this.playTone(784, 0.24, "sine", 0.2, 0.26);
            break;

          case "wrong":
            this.playTone(260, 0.18, "triangle", 0.17);
            this.playTone(190, 0.25, "triangle", 0.15, 0.15);
            break;

          case "combo":
            this.playTone(784, 0.12, "sine", 0.17);
            this.playTone(988, 0.12, "sine", 0.18, 0.12);
            this.playTone(1175, 0.3, "sine", 0.2, 0.24);
            break;

          case "win":
            [523, 659, 784, 1047, 1318].forEach(
              (note, index) => {
                this.playTone(
                  note,
                  0.35,
                  "sine",
                  0.2,
                  index * 0.16
                );
              }
            );
            break;

          case "gameover":
            [392, 349, 294, 220].forEach(
              (note, index) => {
                this.playTone(
                  note,
                  0.35,
                  "triangle",
                  0.15,
                  index * 0.2
                );
              }
            );
            break;
        }
      }

      // A cheerful looping melody generated with Web Audio
      startMusic() {
        if (!this.musicEnabled) return;

        this.initAudio();

        if (!this.audioContext) return;

        if (this.audioContext.state === "suspended") {
          this.audioContext.resume();
        }

        if (this.musicEvent) return;

        const melody = [
          523, 659, 784, 659,
          587, 698, 880, 698,
          523, 659, 784, 988,
          880, 784, 659, 587
        ];

        this.musicIndex = 0;

        const playNextNote = () => {
          if (!this.musicEnabled || !this.audioContext) return;

          const note = melody[this.musicIndex % melody.length];

          this.playTone(note, 0.22, "sine", 0.035);

          // Soft bass accompaniment
          if (this.musicIndex % 4 === 0) {
            const bass = note / 2;
            this.playTone(bass, 0.4, "triangle", 0.035);
          }

          this.musicIndex++;
        };

        playNextNote();

        this.musicEvent = this.time.addEvent({
          delay: 280,
          loop: true,
          callback: playNextNote
        });
      }

      stopMusic() {
        if (this.musicEvent) {
          this.musicEvent.remove();
          this.musicEvent = null;
        }
      }

      toggleMusic() {
        this.musicEnabled = !this.musicEnabled;

        if (this.musicEnabled) {
          this.startMusic();
        } else {
          this.stopMusic();
        }

        this.updateAudioButtons();
      }

      toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        this.updateAudioButtons();

        if (this.sfxEnabled) {
          this.playSound("click");
        }
      }

      updateAudioButtons() {
        if (this.musicButton) {
          this.musicButton.setText(
            this.musicEnabled ? "🎵 MUSIC: ON" : "🔇 MUSIC: OFF"
          );
        }

        if (this.sfxButton) {
          this.sfxButton.setText(
            this.sfxEnabled ? "🔊 SOUND: ON" : "🔕 SOUND: OFF"
          );
        }
      }

      // ==================================
      // BACKGROUND
      // ==================================

      drawBackground() {
        this.cameras.main.setBackgroundColor("#381233");

        this.add.circle(60, 80, 160, 0x7439ff, 0.10);
        this.add.circle(850, 500, 190, 0xff3caa, 0.08);

        for (let i = 0; i < 65; i++) {
          const x = Phaser.Math.Between(10, 890);
          const y = Phaser.Math.Between(10, 590);
          const size = Phaser.Math.Between(1, 3);

          const star = this.add.circle(
            x, y, size, 0xffffff,
            Phaser.Math.FloatBetween(0.2, 0.7)
          );

          this.tweens.add({
            targets: star,
            alpha: 0.1,
            duration: Phaser.Math.Between(800, 2000),
            yoyo: true,
            repeat: -1
          });
        }

        for (let i = 0; i < 12; i++) {
          const particle = this.add.circle(
            Phaser.Math.Between(20, 880),
            Phaser.Math.Between(50, 580),
            Phaser.Math.Between(3, 6),
            Phaser.Utils.Array.GetRandom([
              0xff64c4,
              0x8d6bff,
              0x4be4ff,
              0xffdf65
            ]),
            0.4
          );

          this.tweens.add({
            targets: particle,
            y: particle.y - 35,
            duration: Phaser.Math.Between(2000, 4000),
            yoyo: true,
            repeat: -1
          });
        }
      }

      clearScene() {
        this.tweens.killAll();

        if (this.timerEvent) {
          this.timerEvent.remove();
          this.timerEvent = null;
        }

        this.stopMusic();
        this.time.removeAllEvents();

        this.children.removeAll(true);
        this.balloons = [];

        this.musicButton = null;
        this.sfxButton = null;

        this.drawBackground();
      }

addText(x, y, text, size, color = "#ffffff") {
  const isTitle = size >= 28;

  return this.add.text(x, y, text, {
    fontFamily: isTitle
      ? '"Press Start 2P", monospace'
      : '"Nunito", sans-serif',

    fontSize: `${isTitle ? size * 0.65 : size}px`,
    fontStyle: isTitle ? "normal" : "bold",
    color,

    align: "center",
    lineSpacing: isTitle ? 14 : 8,

    wordWrap: {
      width: 800,
      useAdvancedWrap: true,
    },

    padding: {
      top: 8,
      bottom: 8,
      left: 5,
      right: 5,
    },
  }).setOrigin(0.5);
}

     createButton(x, y, label, callback, color = 0x914dff, width = 230) {
  const bg = this.add.graphics();

  const drawButton = (scale = 1) => {
    bg.clear();

    bg.fillStyle(color, 1);
    bg.lineStyle(2, 0xffffff, 0.5);

    bg.fillRoundedRect(
      x - (width * scale) / 2,
      y - (55 * scale) / 2,
      width * scale,
      55 * scale,
      18
    );

    bg.strokeRoundedRect(
      x - (width * scale) / 2,
      y - (55 * scale) / 2,
      width * scale,
      55 * scale,
      18
    );
  };

  drawButton();

  const buttonText = this.addText(x, y, label, 19, "#ffffff");
  buttonText.setOrigin(0.5);

  const hitArea = this.add.rectangle(x, y, width, 55, 0xffffff, 0);
  hitArea.setInteractive({ useHandCursor: true });

  hitArea.on("pointerover", () => {
    drawButton(1.04);
    buttonText.setScale(1.04);
  });

  hitArea.on("pointerout", () => {
    drawButton(1);
    buttonText.setScale(1);
  });

  hitArea.on("pointerdown", () => {
    callback();
  });

  return hitArea;
}

      // ==================================
      // START MENU
      // ==================================

      showMenu() {
        this.clearScene();

        this.createDecorationBalloon(100, 180, 0xff54a8, 0.8);
        this.createDecorationBalloon(800, 170, 0x47d9ff, 0.8);
        this.createDecorationBalloon(170, 490, 0xffd34e, 0.6);
        this.createDecorationBalloon(750, 480, 0x9d70ff, 0.6);

        this.addText(450, 95, "🎈 BALLOONVERSE 🎈", 47, "#ff69c5");

        this.addText(
          450, 155,
          "THE ULTIMATE MATH ADVENTURE!",
          16, "#ffffff"
        );

        this.add.rectangle(
          450, 355, 490, 370, 0x201e3b, 0.95
        ).setStrokeStyle(2, 0x8755ff);

        this.addText(
          450, 235, "CHOOSE YOUR LEVEL BUDDY!", 24, "#ffffff"
        );

        this.addText(
          450, 275,
          "How good are you at mathematics?",
          16, "#ffffff"
        );

        this.createButton(
          450, 335, "🌱  EASY",
          () => this.startGame("Easy"),
          0x37b987
        );

        this.createButton(
          450, 405, "⚡  MEDIUM",
          () => this.startGame("Medium"),
          0xeaa83d
        );

        this.createButton(
          450, 475, "🔥  HARD",
          () => this.startGame("Hard"),
          0xed5792
        );

        this.addText(
          450, 565,
          "⭐ 10 QUESTIONS • 3 LIVES • 90 SECONDS ⭐",
          14, "#ffffff"
        );

      
      }

      createDecorationBalloon(x, y, color, alpha = 1) {
        const balloon = this.add.container(x, y);

        const body = this.add.ellipse(
          0, 0, 70, 90, color, alpha
        );

        const shine = this.add.ellipse(
          -17, -22, 13, 22, 0xffffff, 0.6
        );

        const knot = this.add.triangle(
          0, 48, -6, 0, 6, 0, 0, 10, color
        );

        const string = this.add.line(
          0, 58, 0, 0, 5, 45, 0xffffff, 0.6
        );

        balloon.add([string, knot, body, shine]);

        this.tweens.add({
          targets: balloon,
          y: y - 25,
          angle: 8,
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut"
        });
      }

      // ==================================
      // START GAME
      // ==================================

      startGame(level) {
        this.initAudio();

        if (this.audioContext?.state === "suspended") {
          this.audioContext.resume();
        }

        this.level = level;
        this.score = 0;
        this.lives = 3;
        this.round = 0;
        this.combo = 0;
        this.bestCombo = 0;
        this.timeLeft = 90;
        this.active = true;
        this.locked = false;

        this.clearScene();

        this.createGameUI();
        this.startMusic();
        this.nextQuestion();

        this.timerEvent = this.time.addEvent({
          delay: 1000,
          loop: true,
          callback: () => {
            if (!this.active) return;

            this.timeLeft--;
            this.timerText.setText(`⏱ ${this.timeLeft}s`);

            if (this.timeLeft <= 0) {
              this.endGame();
            }
          }
        });
      }

      // ==================================
      // GAME INTERFACE
      // ==================================

      createGameUI() {
        this.add.rectangle(
          450, 39, 900, 78, 0x201d3c, 0.95
        ).setStrokeStyle(2, 0x8257ff);

        this.addText(
          450, 37, "🎈 BALLOONVERSE", 29, "#ff68c8"
        );

        // Audio controls
        this.musicButton = this.addText(
          115, 38, "", 12, "#ffffff"
        );

        this.musicButton.setInteractive(
          new Phaser.Geom.Rectangle(-75, -18, 150, 36),
          Phaser.Geom.Rectangle.Contains
        );

        this.musicButton.on("pointerdown", () => {
          this.toggleMusic();
        });

        this.sfxButton = this.addText(
          785, 38, "", 12, "#ffffff"
        );

        this.sfxButton.setInteractive(
          new Phaser.Geom.Rectangle(-75, -18, 150, 36),
          Phaser.Geom.Rectangle.Contains
        );

        this.sfxButton.on("pointerdown", () => {
          this.toggleSFX();
        });

        this.updateAudioButtons();

        this.createInfoPanel(110, 112, "⭐ SCORE", "0");
        this.createInfoPanel(345, 112, "❤️ LIVES", "3");
        this.createInfoPanel(580, 112, "🔥 COMBO", "0");
        this.createInfoPanel(815, 112, "⏱ TIME", "90s");

        this.scoreText = this.addText(110, 151, "0", 22, "#ffe16a");
        this.livesText = this.addText(345, 151, "❤️❤️❤️", 19);
        this.comboText = this.addText(580, 151, "0", 22, "#5be8ff");
        this.timerText = this.addText(815, 151, "90s", 22, "#8ef5bb");

        this.add.rectangle(450, 205, 400, 12, 0x302c4c);

        this.progressBar = this.add.rectangle(
          250, 205, 0, 8, 0x55e6c1
        ).setOrigin(0, 0.5);

        this.progressText = this.addText(
          450, 235, "QUESTION 1 / 10", 14, "#b8b5d7"
        );

        this.add.rectangle(
          450, 315, 460, 110, 0x252343, 1
        ).setStrokeStyle(3, 0x7d5cff);

        this.addText(450, 280, "SOLVE THIS!", 14, "#a98aff");

        this.questionText = this.addText(
          450, 333, "", 45, "#ffffff"
        );

        this.feedbackText = this.addText(
          450, 412,
          "👇 POP THE CORRECT BALLOON! 👇",
          16, "#d5caff"
        );

        this.addText(
          450, 475,
          "TAP A BALLOON TO SELECT YOUR ANSWER",
          12, "#8986aa"
        );
      }

      createInfoPanel(x, y, title, value) {
        this.add.rectangle(
          x, y, 180, 80, 0x201e39, 0.9
        ).setStrokeStyle(1, 0x554b83);

        this.addText(x, y - 15, title, 12, "#aaa4d1");
        this.addText(x, y + 17, value, 19);
      }

      updateHUD() {
        this.scoreText.setText(String(this.score));

        this.livesText.setText(
          "❤️".repeat(Math.max(0, this.lives)) +
          "🖤".repeat(3 - this.lives)
        );

        this.comboText.setText(String(this.combo));
        this.timerText.setText(`${this.timeLeft}s`);

        this.progressText.setText(
          `QUESTION ${this.round} / ${this.maxRounds}`
        );

        this.tweens.add({
          targets: this.progressBar,
          width: 400 * (this.round / this.maxRounds),
          duration: 300,
          ease: "Cubic.easeOut"
        });
      }

      // ==================================
      // MATH QUESTIONS
      // ==================================

      generateQuestion() {
        let a, b, answer, symbol;

        const max = {
          Easy: 10,
          Medium: 30,
          Hard: 100
        }[this.level];

        const operations = {
          Easy: ["+", "-"],
          Medium: ["+", "-", "×"],
          Hard: ["+", "-", "×", "÷"]
        }[this.level];

        symbol = Phaser.Utils.Array.GetRandom(operations);

        if (symbol === "+") {
          a = Phaser.Math.Between(1, max);
          b = Phaser.Math.Between(1, max);
          answer = a + b;
        }

        if (symbol === "-") {
          a = Phaser.Math.Between(1, max);
          b = Phaser.Math.Between(1, a);
          answer = a - b;
        }

        if (symbol === "×") {
          a = Phaser.Math.Between(2, this.level === "Hard" ? 12 : 10);
          b = Phaser.Math.Between(2, 10);
          answer = a * b;
        }

        if (symbol === "÷") {
          b = Phaser.Math.Between(2, 10);
          answer = Phaser.Math.Between(2, 12);
          a = b * answer;
        }

        return {
          question: `${a} ${symbol} ${b} = ?`,
          answer
        };
      }

      generateAnswers(correct) {
        const answers = [correct];

        while (answers.length < 4) {
          const offset = Phaser.Math.Between(1, 10);
          const direction = Math.random() < 0.5 ? -1 : 1;

          const wrong = Math.max(
            0,
            correct + offset * direction
          );

          if (!answers.includes(wrong)) {
            answers.push(wrong);
          }
        }

        return Phaser.Utils.Array.Shuffle(answers);
      }

      // ==================================
      // NEXT QUESTION
      // ==================================

      nextQuestion() {
        if (!this.active) return;

        if (this.round >= this.maxRounds) {
          this.endGame();
          return;
        }

        this.locked = false;

        this.balloons.forEach(balloon => balloon.destroy());
        this.balloons = [];

        this.round++;

        const data = this.generateQuestion();

        this.correctAnswer = data.answer;
        this.questionText.setText(data.question);

        this.feedbackText.setText("👇 POP THE CORRECT BALLOON! 👇");
        this.feedbackText.setColor("#d5caff");

        this.updateHUD();

        const answers = this.generateAnswers(data.answer);

        const positions = [120, 360, 600, 840];

        const colors = [
          0xff3e91,
          0xffc83d,
          0x8857ff,
          0x11cfc1
        ];

        answers.forEach((answer, index) => {
          this.createBalloon(
            positions[index],
            Phaser.Math.Between(520, 555),
            answer,
            colors[index],
            index
          );
        });
      }

      // ==================================
      // BALLOON DESIGN
      // ==================================

      createBalloon(x, y, answer, color, index) {
        const balloon = this.add.container(x, y);

        const body = this.add.ellipse(
          0, 0, 108, 130, color
        ).setStrokeStyle(3, 0xffffff, 0.9);

        const shine = this.add.ellipse(
          -25, -32, 19, 32, 0xffffff, 0.55
        );

        const smallShine = this.add.circle(
          22, -40, 6, 0xffffff, 0.35
        );

        const knot = this.add.triangle(
          0, 70, -8, 0, 8, 0, 0, 15, color
        );

        const string = this.add.line(
          0, 82, 0, 0, 5, 45, 0xffffff, 0.65
        );

        const number = this.addText(
          0, 0, String(answer), 37, "#ffffff"
        );

        number.setStroke("#42345e", 3);

        balloon.add([
          string, knot, body, shine, smallShine, number
        ]);

        balloon.setSize(120, 155);

        balloon.setInteractive(
          new Phaser.Geom.Rectangle(-60, -75, 120, 155),
          Phaser.Geom.Rectangle.Contains
        );

        balloon.answer = answer;

        balloon.on("pointerover", () => {
          if (!this.locked && this.active) {
            balloon.setScale(1.12);
          }
        });

        balloon.on("pointerout", () => balloon.setScale(1));

        balloon.on("pointerdown", () => {
          this.checkAnswer(balloon);
        });

        this.balloons.push(balloon);

        this.tweens.add({
          targets: balloon,
          y: y - Phaser.Math.Between(65, 110),
          duration: Phaser.Math.Between(2200, 3200),
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
          delay: index * 180
        });

        this.tweens.add({
          targets: balloon,
          x: x + 15,
          duration: 1600 + index * 200,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut"
        });
      }

      // ==================================
      // ANSWER CHECKING
      // ==================================

      checkAnswer(balloon) {
        if (!this.active || this.locked || !balloon.active) return;

        if (balloon.answer === this.correctAnswer) {
          this.correctAnswerAction(balloon);
        } else {
          this.wrongAnswerAction(balloon);
        }
      }

      correctAnswerAction(balloon) {
        this.locked = true;

        this.combo++;
        this.bestCombo = Math.max(this.bestCombo, this.combo);

        let points = 10;

        if (this.combo % 3 === 0) {
          points += 5;
        }

        this.score += points;

        this.playSound("pop");

        if (this.combo % 3 === 0) {
          this.playSound("combo");
          this.feedbackText.setText(
            `🔥 AMAZING COMBO! +${points} POINTS!`
          );
        } else {
          this.playSound("correct");
          this.feedbackText.setText(
            `🎉 CORRECT! +${points} POINTS!`
          );
        }

        this.feedbackText.setColor("#55f0ad");

        this.updateHUD();

        this.createPopEffect(balloon.x, balloon.y, 0xff69c5);
        this.showFloatingScore(balloon.x, balloon.y, `+${points} ⭐`);

        this.time.delayedCall(1000, () => {
          if (this.active) this.nextQuestion();
        });
      }

      wrongAnswerAction(balloon) {
        balloon.disableInteractive();

        this.lives--;
        this.combo = 0;

        this.playSound("wrong");

        this.feedbackText.setText(
          "💔 NOT QUITE! TRY ANOTHER BALLOON!"
        );

        this.feedbackText.setColor("#ff7c9e");

        this.updateHUD();

        this.tweens.add({
          targets: balloon,
          scale: 0.1,
          alpha: 0,
          duration: 350,
          onComplete: () => balloon.destroy()
        });

        if (this.lives <= 0) {
          this.time.delayedCall(600, () => this.endGame());
        }
      }

      // ==================================
      // VISUAL EFFECTS
      // ==================================

      createPopEffect(x, y, color) {
        for (let i = 0; i < 18; i++) {
          const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
          const distance = Phaser.Math.Between(50, 110);

          const particle = this.add.circle(
            x, y,
            Phaser.Math.Between(3, 7),
            Phaser.Utils.Array.GetRandom([
              color,
              0xffffff,
              0xffdf55,
              0xff65c5,
              0x51e6ff
            ])
          );

          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            alpha: 0,
            scale: 0.1,
            duration: 500,
            onComplete: () => particle.destroy()
          });
        }
      }

      showFloatingScore(x, y, message) {
        const score = this.addText(
          x, y, message, 28, "#fff16a"
        );

        this.tweens.add({
          targets: score,
          y: y - 80,
          alpha: 0,
          duration: 850,
          onComplete: () => score.destroy()
        });
      }

      createConfetti() {
        const colors = [
          0xff4baf,
          0xffd447,
          0x45e9ff,
          0x9c6aff,
          0x4df0ad
        ];

        for (let i = 0; i < 65; i++) {
          const confetti = this.add.rectangle(
            Phaser.Math.Between(20, 880),
            Phaser.Math.Between(-200, -20),
            8, 12,
            Phaser.Utils.Array.GetRandom(colors)
          );

          this.tweens.add({
            targets: confetti,
            y: Phaser.Math.Between(450, 680),
            angle: Phaser.Math.Between(-360, 360),
            duration: Phaser.Math.Between(1800, 3500),
            delay: Phaser.Math.Between(0, 1200),
            onComplete: () => confetti.destroy()
          });
        }
      }

      // ==================================
      // GAME OVER / WIN
      // ==================================

      endGame() {
        if (!this.active) return;

        this.active = false;
        this.locked = true;

        if (this.timerEvent) {
          this.timerEvent.remove();
          this.timerEvent = null;
        }

        this.stopMusic();
        this.tweens.killAll();

        this.balloons.forEach(balloon => balloon.destroy());
        this.balloons = [];

        const won =
          this.round >= this.maxRounds && this.lives > 0;

        if (won) {
          this.playSound("win");
        } else {
          this.playSound("gameover");
        }

        this.add.rectangle(
          450, 320, 900, 640, 0x090914, 0.94
        );

        if (won) this.createConfetti();

        this.addText(
          450, 175,
          won ? "🏆 YOU DID IT! 🏆" : "💜 NICE TRY! 💜",
          42,
          won ? "#ffe36b" : "#ff75c2"
        );

        this.addText(
          450, 235,
          won ? "YOU ARE A MATH SUPERSTAR!" :
            "EVERY TRY MAKES YOU BETTER!",
          17, "#c8c3e9"
        );

        this.add.rectangle(
          450, 350, 420, 175, 0x252343
        ).setStrokeStyle(2, 0x9965ff);

        this.addText(
          450, 300, "YOUR FINAL SCORE", 14, "#aaa3d2"
        );

        this.addText(
          450, 350, `${this.score} ⭐`, 48, "#ffe36b"
        );

        this.addText(
          450, 405,
          `Questions completed: ${Math.min(this.round, 10)} / 10`,
          17, "#ffffff"
        );

        this.addText(
          450, 435,
          `Difficulty: ${this.level} • Best combo: ${this.bestCombo}`,
          13, "#b9b2dd"
        );

        this.createButton(
          450, 515, "🔄 PLAY AGAIN",
          () => this.startGame(this.level),
          0x9955ff
        );

        this.createButton(
          450, 580, "🏠 MAIN MENU",
          () => this.showMenu(),
          0x34466c
        );
      }

      shutdown() {
        this.active = false;
        this.stopMusic();

        if (this.audioContext) {
          this.audioContext.close();
          this.audioContext = null;
        }
      }
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 900,
      height: 640,
      parent: gameRef.current,
      backgroundColor: "#101020",
      scene: BalloonScene,

      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },

      render: {
        antialias: true,
        pixelArt: false
      },

      input: {
        activePointers: 3
      }
    });

    instanceRef.current = game;

    return () => {
      game.destroy(true);
      instanceRef.current = null;
    };
  }, []);

  return (
    <div className="phaser-wrapper">
      <div ref={gameRef} className="phaser-game" />
    </div>
  );
};

export default BalloonGame;
