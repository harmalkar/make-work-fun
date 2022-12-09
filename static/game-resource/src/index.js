import Phaser from 'phaser';
import { invoke, view } from '@forge/bridge';
import { RESOLVERS } from '../../../src/types';

class DevsUnleashedStarter extends Phaser.Scene {
    width;
    height;

    context;
    moduleType;
    product;

    projects = {};
    spaces = {};

    async create() {
        this.width = this.cameras.main.width;
        this.height = this.cameras.main.height;

        await view.getContext().then((ctx) => {
            this.context = ctx;
            this.moduleType = ctx.extension.type;
            this.product =
                ctx.extension.type === 'macro' ? 'confluence' : ctx.extension.type.split(':')[0];
            console.log('ctx', ctx);
        });

        this.createLoadingBar();

        if (this.product === 'jira') {
            this.loadJiraProjectsAvatars();
        }

        if (this.product === 'confluence') {
            this.loadConfluenceSpacesAvatars();
        }
    }

    loadCompleted() {
        this.make
            .text({
                x: this.width / 2,
                y: this.height / 2 - 50,
                text: this.moduleType,
                style: {
                    font: '36px',
                },
            })
            .setOrigin(0.5, 0.5);
    }

    async loadJiraProjectsAvatars() {
        invoke(RESOLVERS.GET_PROJECTS, { expand: 'urls' }).then(({ data }) => {
            data.values.forEach((project) => {
                this.projects[project.key] = {
                    key: project.key,
                    avatarKey: `${project.key}-avatar`,
                    avatarUrl: project.avatarUrls['48x48'],
                };

                this.load.image(
                    this.projects[project.key].avatarKey,
                    this.projects[project.key].avatarUrl,
                );
            });

            this.load.start();
        });

        this.load.on('complete', () => {
            for (const projectKey in this.projects) {
                const project = this.projects[projectKey];
                const x = Phaser.Math.Between(0, 800);
                const y = Phaser.Math.Between(0, 600);

                this.matter.add.image(x, y, project.avatarKey);
            }
        });
    }

    async loadConfluenceSpacesAvatars() {
        invoke(RESOLVERS.GET_SPACES, { expand: ['icon'] }).then(({ data }) => {
            data.results.forEach((space) => {
                console.log(space);

                this.spaces[space.key] = {
                    key: space.key,
                    name: space.name,
                };

                const x = Phaser.Math.Between(0, 800);
                const y = Phaser.Math.Between(0, 600);

                const spaceKeyText = this.add.text(x, y, `[${space.key}] ${space.name}`, {
                    style: {
                        font: '24px',
                    },
                });

                this.matter.add.gameObject(spaceKeyText);
            });

            this.load.start();
        });
    }

    createLoadingBar() {
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);

        const loadingText = this.make.text({
            x: this.width / 2,
            y: this.height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
            },
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.make.text({
            x: this.width / 2,
            y: this.height / 2 - 5,
            text: '0%',
            style: {
                font: '18px monospace',
            },
        });
        percentText.setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            percentText.setText(`${value * 100}%`);
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();

            this.loadCompleted();
        });
    }
}

const config = {
    type: Phaser.WEBGL,
    backgroundColor: '#0052CC',
    parent: 'phaser-example',
    scale: {
        mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
        max: {
            width: 800,
            height: 600,
        },
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: {
                y: 0.3,
            },
            setBounds: true,
        },
    },
    scene: DevsUnleashedStarter,
};

const game = new Phaser.Game(config);
