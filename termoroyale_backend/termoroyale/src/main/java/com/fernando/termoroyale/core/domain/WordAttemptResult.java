package com.fernando.termoroyale.core.domain;

import java.util.List;

public record WordAttemptResult(
   String guess,
   List<LetterStatus> feedback,
   boolean isWin
){}

