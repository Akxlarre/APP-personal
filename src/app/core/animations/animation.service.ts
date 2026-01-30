import { Injectable } from '@angular/core';
import gsap from 'gsap';

@Injectable({ providedIn: 'root' })
export class AnimationService {

    playStreakAnimation(element: HTMLElement, days: number) {
        const tl = gsap.timeline();

        tl.to(element, {
            scale: 1.2,
            duration: 0.3,
            ease: 'back.out(1.7)'
        })
            .to(element, {
                rotate: 360,
                duration: 0.5
            })
            .to(element, {
                scale: 1,
                duration: 0.2
            });

        if ([7, 30, 100].includes(days)) {
            this.playConfetti(element.parentElement || document.body);
        }
    }

    playStreakLost(element: HTMLElement) {
        const tl = gsap.timeline();

        tl.to(element, {
            x: -10,
            duration: 0.05,
            repeat: 5,
            yoyo: true
        });

        tl.to(element, {
            opacity: 0,
            scale: 0.5,
            duration: 0.4,
            ease: 'power2.in',
            onComplete: () => {
                gsap.set(element, { opacity: 1, scale: 1, x: 0 });
            }
        });
    }

    playStreakMilestone(blockName: string, days: number) {
        console.log(`Milestone reached for ${blockName}: ${days} days!`);
        // Implement specific milestone animation or toast here
    }

    private playConfetti(container: HTMLElement) {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'confetti-particle';
            particle.style.position = 'absolute';
            particle.style.width = '10px';
            particle.style.height = '10px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            // Center start
            particle.style.left = '50%';
            particle.style.top = '50%';

            container.appendChild(particle);

            gsap.fromTo(particle,
                {
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: 1
                },
                {
                    x: (Math.random() - 0.5) * 300,
                    y: -200 + Math.random() * 100,
                    opacity: 0,
                    scale: 0,
                    duration: 1.5,
                    ease: 'power2.out',
                    onComplete: () => particle.remove()
                }
            );
        }
    }
}
