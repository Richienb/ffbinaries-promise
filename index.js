const os = require("os")
const ky = require("ky-universal").create({
    prefixUrl: "https://ffbinaries.com/api/v1/",
})
const _ = require("lodash")
const joinURL = require("url-join")
const download = require("download")
const latestSemver = require("latest-semver")

module.exports = {
    getVersions: async () => _
        .chain(await ky("versions").json())
        .get("versions")
        .keys()
        .tail()
        .value(),
    async getLatestVersion() {
        return latestSemver(await this.getVersions())
    },
    getVersion: ({ version = "latest" } = {}) => ky(joinURL("version", version)).json(),
    async downloadBinaries({ components = ["ffmpeg", "ffprobe", "ffplay", "ffserver"], version = "latest", extract = true, destination = process.cwd() } = {}) {
        return _
            .chain(await this.getVersion(version))
            .get("bin")
            .get(this.currentPlatform)
            .pick(components)
            .mapValues((url) => download(url, destination, {
                extract,
            }))
            .thru(() => undefined)
            .value()
    },
    supportedPlatforms: ["osx-64", "linux-32", "linux-64", "linux-armel", "linux-armhf", "windows-32", "windows-64"],
    currentPlatform: (() => {
        const type = _.toLower(os.type())
        const arch = _.toLower(os.arch())

        if (type === "darwin") return "osx-64"

        if (type === "windows_nt") return arch === "x64" ? "windows-64" : "windows-32"

        if (type === "linux") {
            if (arch === "arm" || arch === "arm64") return "linux-armel"
            return arch === "x64" ? "linux-64" : "linux-32"
        }

        return null
    })(),
}
