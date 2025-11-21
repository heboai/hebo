import { useNavigate } from "react-router";

import { Button } from "@hebo/shared-ui/components/Button";

import { isStackAuthEnabled } from "~console/lib/env";
import { getStackApp } from "~console/lib/auth/stack-auth";
import React from "react";


export function OAuthSignIn() {
  if (isStackAuthEnabled) {
    const stackApp = getStackApp();
    const redirect = async (provider: string) => stackApp.signInWithOAuth(provider);

    return (
      <>
        <SignInButton provider="github" icon={GithubIcon} redirect={redirect}/>
        <SignInButton provider="google" icon={GoogleIcon} redirect={redirect}/>
        <SignInButton provider="microsoft" icon={MicrosoftIcon} redirect={redirect}/>
      </>
    )
  }
  
  const navigate = useNavigate();
  const redirect = async () => navigate("/");

  return (
    <SignInButton provider="dummy" redirect={redirect}/>
  );
}

function SignInButton({ provider, icon: Icon, redirect }: { provider: string, icon?: React.ComponentType, redirect: (provider: string) => Promise<void> }) {
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <Button
      variant="outline"
      className="w-full"
      isLoading={isLoading}
      onClick={async () => {
        try {
          setIsLoading(true);
          await redirect(provider);
        } finally {
          setIsLoading(false);
        }
      }}
    >
      {!isLoading && (
        <>
          { Icon && <Icon /> }
          Sign in with {provider.charAt(0).toUpperCase()}{provider.slice(1)}
        </>
      )
      }
    </Button>
  );
}


function GithubIcon({ width = 24, height = 24}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* … SVG path data copied from the Microsoft logo file … */}
    </svg>
  );
}

function GoogleIcon({ width = 24, height = 24}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* … SVG path data copied from the Microsoft logo file … */}
    </svg>
  );
}

function MicrosoftIcon({ width = 24, height = 24}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* … SVG path data copied from the Microsoft logo file … */}
    </svg>
  );
}
