export const github = {
    context: {
        repo: {
            get owner() {
                if (!process.env.CIRCLE_PROJECT_USERNAME) {
                    throw new Error('CIRCLE_PROJECT_USERNAME is not set');
                }
                return process.env.CIRCLE_PROJECT_USERNAME
            },
            get name() {
                if (!process.env.CIRCLE_PROJECT_REPONAME) {
                    throw new Error('CIRCLE_PROJECT_REPONAME is not set');
                }
                return process.env.CIRCLE_PROJECT_REPONAME;
            },
        },
        get branch() {
            if (!process.env.CIRCLE_BRANCH) {
                throw new Error('CIRCLE_BRANCH is not set');
            }
            return process.env.CIRCLE_BRANCH;
        },
        get sha() {
            if (!process.env.CIRCLE_SHA1) {
                throw new Error('CIRCLE_SHA1 is not set');
            }
            return process.env.CIRCLE_SHA1;
        },
    }
}
