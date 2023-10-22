import * as core from '@actions/core'
import * as github from '@actions/github'
import { promises as fs } from 'fs'
import path from 'path'
import { createActionAuth } from '@octokit/auth-action'

interface MissingTest {
  originalPath: string
  testPath: string
  fileName: string
  testFileName: string
}

export async function run(): Promise<void> {
  try {
    const auth = createActionAuth()
    const authentication = await auth()
    const octokit = github.getOctokit(authentication.token)

    const { repo, owner, number: issue_number } = github.context.issue

    const missingTests: MissingTest[] = []
    const libPath = path.join(process.cwd(), 'lib')

    const checkFiles = async (dir: string): Promise<void> => {
      const files = await fs.readdir(dir)
      for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = await fs.stat(filePath)
        if (stat.isDirectory()) {
          await checkFiles(filePath)
        } else if (file.endsWith('.dart')) {
          const relativePath = path.relative(libPath, filePath)
          const testFilePath = path.join(
            process.cwd(),
            'test',
            relativePath.replace('.dart', '_test.dart')
          )

          try {
            await fs.access(testFilePath)
          } catch {
            const originalPath = filePath
            const testPath = testFilePath
            const fileName = path.basename(originalPath)
            const testFileName = path.basename(testPath)
            missingTests.push({
              originalPath,
              testPath,
              fileName,
              testFileName
            })
          }
        }
      }
    }

    await checkFiles(libPath)

    const commentMarker = '👵 Flutter Mama'
    const comments = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number
    })
    const mamaComment = comments.data.find(
      comment => comment?.body?.includes(commentMarker)
    )

    if (missingTests.length > 0) {
      core.setOutput('missingTests', true)
      core.setOutput('missingArray', JSON.stringify(missingTests))

      const labelName = 'Missing Tests'
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number,
        labels: [labelName]
      })

      const commentBody = `${commentMarker}\n\n### Missing Test Files:\n${missingTests
        .map(test => `- [ ] ${test.fileName} (Test file: ${test.testFileName})`)
        .join('\n')}`
      if (mamaComment) {
        if (mamaComment.body !== commentBody) {
          await octokit.rest.issues.updateComment({
            owner,
            repo,
            comment_id: mamaComment.id,
            body: commentBody
          })
        }
      } else {
        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number,
          body: commentBody
        })
      }
    } else {
      core.setOutput('missingTests', false)
      const labelName = 'Missing Tests'
      try {
        await octokit.rest.issues.removeLabel({
          owner,
          repo,
          issue_number,
          name: labelName
        })
      } catch (error) {
        core.info(`Label '${labelName}' not found or already removed.`)
      }

      if (
        mamaComment &&
        mamaComment.body !== `${commentMarker}\n\n✅ All widgets have tests`
      ) {
        await octokit.rest.issues.updateComment({
          owner,
          repo,
          comment_id: mamaComment.id,
          body: `${commentMarker}\n\n✅ All widgets have tests`
        })
      }
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
