package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os/exec"
	"regexp"
	"strconv"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) CopyPaste(source string, dest string) string {
	// start := time.Now().Unix()

	commandString := fmt.Sprintf("robocopy %s %s /E /MT /UNILOG:\".\\logs\\backup-copy.log\"", source, dest)

	cmd := exec.Command("pwsh.exe", "-nologo", "-noprofile", "-Command", commandString)

	// 2. Setup stdout/stderr streaming
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Sprintf("Error setting up stdout pipe: %v", err)
	}

	if err = cmd.Start(); err != nil {
		return fmt.Sprintf("Error starting command: %v", err)
	}

	go func() {
		defer cmd.Wait()

		scanner := bufio.NewScanner(stdout)
		re := regexp.MustCompile(`^\s*(\d+)%`)

		var currentProgress int

		for scanner.Scan() {
			line := scanner.Text()

			matches := re.FindStringSubmatch(line)

			fmt.Println(line)
			fmt.Printf("matched length : %d\n", len(matches))

			if len(matches) > 1 {
				progressStr := matches[1]

				if progressInt, err := strconv.Atoi(progressStr); err == nil {

					if progressInt != currentProgress {
						currentProgress = progressInt

						runtime.EventsEmit(a.ctx, "copyProgress", currentProgress)
					}
				}
			}
		}

		if err := scanner.Err(); err != nil {
			log.Printf("Error reading stdout: %v", err)

			runtime.EventsEmit(a.ctx, "copyStatus", fmt.Sprintf("Error during streaming %v", err))
			return
		}

		err := cmd.Wait()
		if err != nil {
			// Use the robust exit code handling for robocopy exit status 1-7
			if exitErr, ok := err.(*exec.ExitError); ok {
				exitCode := exitErr.ExitCode()
				if exitCode >= 0 && exitCode <= 7 {
					runtime.EventsEmit(a.ctx, "copyStatus", fmt.Sprintf("Copy finished successfully (Status %d)", exitCode))
					// Emit 100% finished progress
					runtime.EventsEmit(a.ctx, "copyProgress", 100)
					return
				}
			}
			// Critical failure (exit code 8+)
			runtime.EventsEmit(a.ctx, "copyStatus", fmt.Sprintf("Copy failed critically: %v", err))
			return
		}

		// Command finished successfully with exit code 0
		runtime.EventsEmit(a.ctx, "copyStatus", "Copy finished successfully (Status 0)")
		runtime.EventsEmit(a.ctx, "copyProgress", 100)

	}()

	return "Copy command started successfully. Awaiting status..."

	// output, err := cmd.CombinedOutput()

	// if err != nil {
	// 	log.Print(err)
	// 	return fmt.Sprintf("Error executing command: %v\nOutput: %s", err, output)
	// }

	// return fmt.Sprintf("Command executed successfully:\n%s", output)
}
