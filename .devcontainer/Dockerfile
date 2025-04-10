FROM node:23

ARG USERNAME=dev
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Create the dev user
RUN groupadd --gid $USER_GID -o $USERNAME
RUN useradd -u $USER_UID -g $USER_GID -m -o -s /bin/bash $USERNAME

# Add sudo support
RUN apt update \
    && apt install -y sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# Set timezone
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install packages
RUN apt update \
    && apt install -y npm \
    && apt install -y git procps \
    && apt install -y --no-install-recommends apt-utils 2>&1

    
    # Clean up
RUN apt autoremove -y \
    && apt clean -y \
    && rm -rf /var/lib/apt/lists/*
    
# Set the default user
USER $USERNAME
    
RUN echo 'alias ll="ls -l"' >> ~/.bashrc

# Set the default shell to bash rather than sh
ENV SHELL=/bin/bash