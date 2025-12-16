import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "@/index.css";
import { useEffect, useId, useState } from "react";
import { CopyPaste } from "../wailsjs/go/main/App";
import MyProgress from "./components/myApp/MyProgress";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { cn } from "./lib/utils";
import * as runtime from "../wailsjs/runtime";
type InputCompProps = {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
};
const InputComp: React.FC<InputCompProps> = ({
  label,
  name,
  value,
  onChange,
}) => {
  const id = useId();
  const elmId = `${name}${id}`;
  return (
    <div className="flex flex-col gap-y-1 shadow-md bg-slate-200 rounded-md p-2">
      <Label htmlFor={elmId}>{label}</Label>
      <Input
        className={cn("bg-white")}
        type="text"
        name={name}
        id={elmId}
        value={value}
        onChange={(evt) => onChange(evt.target.value)}
      />
    </div>
  );
};

function App() {
  const [source, setSource] = useState("");
  const [dest, setDest] = useState("");
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [output, setOutput] = useState("");

  useEffect(() => {
    // Listener for progress (0-100)
    runtime.EventsOn("copyProgress", (value: number) => {
      setProgress(value);
    });

    // Listener for final status (success/error message)
    runtime.EventsOn("copyStatus", (status: string) => {
      setOutput(status);
      setSubmitting(false); // End the loading state when status received
    });

    // Clean up listeners when the component unmounts
    return () => {
      runtime.EventsOff("copyProgress");
      runtime.EventsOff("copyStatus");
    };
  }, []);

  const onSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    setSubmitting(true);
    try {
      const result = await CopyPaste(source, dest);
      console.log({ result });
      setOutput(result);

      // now I have to run
      // robocopy node_modules node_modules4 /MIR /MT | Out-Null
    } catch (error) {
      console.error(error);
    } finally {
      // setSubmitting(false);
      console.log("finally called");
    }
  };

  return (
    <ThemeProvider
      defaultTheme="light"
      storageKey="fast-copy-paste-theme">
      <div className="h-full flex items-center justify-center ">
        <Card className="w-4/5">
          <CardContent>
            <form
              action="#"
              onSubmit={onSubmit}>
              <div className="flex flex-col gap-y-2">
                <div className="flex flex-col gap-y-2">
                  <InputComp
                    label="Source Path"
                    name="source"
                    value={source}
                    onChange={setSource}
                  />
                  <InputComp
                    label="Destination Paths"
                    name="destination"
                    value={dest}
                    onChange={setDest}
                  />
                </div>

                <div>
                  <Button
                    type="submit"
                    disabled={submitting}>
                    {submitting ? "Submitting" : "Start Copy"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
          <CardContent>
            <p className="h-8">{output ? output : "No result"}</p>
          </CardContent>
          <CardContent>
            <Label>Progress</Label>
            <MyProgress progress={progress} />
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  );
}

export default App;
