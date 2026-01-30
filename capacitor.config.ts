import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.lifeblocks.app',
    appName: 'Life Blocks',
    webDir: 'dist/life-blocks/browser',
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: "#1a202c",
            showSpinner: false,
        },
        LocalNotifications: {
            smallIcon: "ic_stat_icon_config_sample",
            iconColor: "#488AFF",
            sound: "beep.wav",
        },
    },
};

export default config;
