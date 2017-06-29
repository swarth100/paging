module.exports = {
    apps: [{
        name: 'paging',
        script: './server.js',
    }],
    deploy: {
        dev: {
            'user': 'ubuntu',
            'host': 'spina.me',
            'key': '~/Documents/AWS/spina.pem',
            'ref': 'origin/dev',
            'repo': 'git@gitlab.doc.ic.ac.uk:as12015/paging.git',
            'path': '/home/ubuntu/paging',
            'post-deploy': 'npm install && npm run build && pm2 startOrRestart ecosystem.config.js',
        },
        ci: {
            'user': 'ubuntu',
            'host': 'spina.me',
            'ref': 'origin/dev',
            'repo': 'git@gitlab.doc.ic.ac.uk:as12015/paging.git',
            'path': '/home/ubuntu/paging',
            'post-deploy': 'npm install && npm run build && pm2 startOrRestart ecosystem.config.js',
        },
    },
};