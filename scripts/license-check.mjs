import cp from 'child_process'
import fs from 'fs/promises'
import { buildDepTreeFromFiles } from 'snyk-nodejs-lockfile-parser'

const allDepVersions = new Map()

async function addDepsForRoot(root, subdir) {
	const tree = await buildDepTreeFromFiles(
		root,
		subdir ? `packages/${subdir}/package.json` : 'package.json',
		'yarn.lock',
		true,
		false,
	)

	function flattenAndAddDeps(node) {
		let entry = allDepVersions.get(node.name)
		if (!entry) {
			entry = new Set()
			allDepVersions.set(node.name, entry)
		}

		if (!entry.has(node.version)) {
			entry.add(node.version)

			if (node.dependencies) {
				for (const obj of Object.values(node.dependencies)) {
					flattenAndAddDeps(obj)
				}
			}
		}
	}

	flattenAndAddDeps(tree)
}

await addDepsForRoot('.')
for (const dirname of await fs.readdir(new URL('../packages', import.meta.url))) {
	await addDepsForRoot('.', dirname)
}

const allowPackages = []
for (const [name, versions] of allDepVersions) {
	if (name.startsWith('@img/sharp') || name === '@elgato-stream-deck/webhid-demo') {
		for (const version of versions) {
			allowPackages.push(`${name}@${version}`)
		}
	}
}

cp.exec(`yarn sofie-licensecheck --allowPackages "${allowPackages.join(';')}"`, (error, stdout, stderr) => {
	if (error) {
		console.error(`error: ${error.message}`)
		return
	}

	if (stderr) {
		console.error(stderr)
		return
	}

	console.log(stdout)
})
