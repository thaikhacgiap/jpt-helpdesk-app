import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

// Execute shell commands using promises
const execPromise = (command: string, cwd: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout || stderr);
      }
    });
  });
};

export async function GET(req: NextRequest) {
  const workspacePath = "d:\\JPROTECH COMPANY\\JPT Helpdesk Application\\jpt-helpdesk-app";
  const backupFileName = `backup_jpt_helpdesk_${Date.now()}.zip`;
  const backupFilePath = path.join(workspacePath, backupFileName);

  try {
    // Run PowerShell Compress-Archive command
    // Excluding node_modules, .next, .git, and any temporary zip files
    const command = `powershell.exe -Command "Get-ChildItem -Path . -Exclude 'node_modules', '.next', '.git', '*.zip' | Compress-Archive -DestinationPath '${backupFileName}' -Force"`;
    
    await execPromise(command, workspacePath);

    // Read the generated zip file
    if (!fs.existsSync(backupFilePath)) {
      throw new Error("Backup file was not created successfully.");
    }

    const fileBuffer = fs.readFileSync(backupFilePath);

    // Delete the file from the local server to clean up
    fs.unlinkSync(backupFilePath);

    // Return the file stream
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=backup_jpt_helpdesk.zip`,
      },
    });

  } catch (err: any) {
    console.error("Backup error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create application backup." },
      { status: 500 }
    );
  }
}
