async function wait(time) {
    return new Promise(res => setTimeout(res, time));
}
module.exports = {
    getUserById: async function ({id}) {
        await wait(8888);
        return {
            id,
            name: 'Evgeny Godunov'
        }
    }
};