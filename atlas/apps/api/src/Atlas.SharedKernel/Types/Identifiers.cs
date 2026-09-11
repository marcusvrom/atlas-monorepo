namespace Atlas.SharedKernel.Types;

/// <summary>
/// Ids tipados impedem trocar acidentalmente um ExerciseId por um PlanId.
///
/// UUID v7 em vez de v4: ordenação temporal aproximada dá localidade de escrita
/// no B-tree, menos page splits e índices menores. Diferença mensurável em
/// tabela de 100M+ linhas. Ver spec 00 §5.2 (b).
/// </summary>
public readonly record struct UserId(Guid Value)
{
    public static UserId New() => new(Guid.CreateVersion7());
    public override string ToString() => Value.ToString();
}

public readonly record struct ExerciseId(Guid Value)
{
    public static ExerciseId New() => new(Guid.CreateVersion7());
    public override string ToString() => Value.ToString();
}

public readonly record struct WorkoutPlanId(Guid Value)
{
    public static WorkoutPlanId New() => new(Guid.CreateVersion7());
    public override string ToString() => Value.ToString();
}

public readonly record struct SessionId(Guid Value)
{
    public static SessionId New() => new(Guid.CreateVersion7());
    public override string ToString() => Value.ToString();
}
